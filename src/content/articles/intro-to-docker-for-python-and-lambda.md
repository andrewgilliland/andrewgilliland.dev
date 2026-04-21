---
title: Intro to Docker for Python and Lambda
date: 2026-04-04
excerpt: When zip files aren't enough, container images let you package anything for Lambda. Here's how to use Docker with Python.
draft: false
---

Lambda's default deployment model is a ZIP file - your code and its dependencies bundled together and uploaded. For most functions, this works fine. But it has a hard ceiling: 50 MB compressed, 250 MB unzipped. Once you add `pandas`, `scikit-learn`, or anything with native binary dependencies, you'll hit that ceiling fast. Container images raise the limit to 10 GB and eliminate an entire class of packaging problems. This article covers how Docker works, how to use it with Lambda, and when it's worth the tradeoff.

## Why Docker for Lambda?

There are three problems that drive teams to container images for Lambda:

**Dependency size.** `scikit-learn` + `numpy` + `pandas` alone is around 200 MB unzipped. Add `scipy`, a trained model artifact, or any deep learning library and you're well over the ZIP limit before your own code is included. Container images have a 10 GB limit, which is effectively unlimited for most real workloads.

**Native binaries.** Lambda runs on Amazon Linux 2023 (x86_64 or arm64). If you install a package like `psycopg2` on your Mac and zip it up, it won't run on Lambda - the compiled `.so` files are for the wrong OS and architecture. You can work around this with Lambda Layers built on Amazon Linux, but it's fragile. A Dockerfile builds and packages everything in the target environment from the start.

**Consistent local development.** With a ZIP-based Lambda, your local environment is your machine - Python version, OS libraries, and everything else. With a container image, `docker run` on your laptop runs exactly the same environment that will run in Lambda. What works locally will work in production.

## Docker Basics for Python Developers

Docker is a tool for packaging applications into **images** - self-contained, immutable snapshots of everything needed to run a piece of software. An **image** is the blueprint; a **container** is a running instance of that blueprint. You can run the same image many times as many separate containers, each isolated from the others.

Images are built from **layers**. Each instruction in a `Dockerfile` creates a new layer on top of the previous one. Layers are cached - if nothing has changed in a layer since the last build, Docker reuses the cached version. This makes rebuilds fast when only your application code changes.

Key Dockerfile instructions:

| Instruction  | What it does                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `FROM`       | Sets the base image. Every `Dockerfile` starts here.                                            |
| `WORKDIR`    | Sets the working directory for subsequent instructions. Created if it doesn't exist.            |
| `COPY`       | Copies files from your local filesystem into the image.                                         |
| `RUN`        | Executes a shell command during the build (e.g., `pip install`). Creates a new layer.           |
| `ENV`        | Sets an environment variable available at build time and runtime.                               |
| `EXPOSE`     | Documents that the container listens on a port. Informational only - does not publish the port. |
| `CMD`        | The default command to run when the container starts. Can be overridden at runtime.             |
| `ENTRYPOINT` | Like `CMD` but harder to override - sets the executable the container runs as.                  |

**Layer caching** is the most important practical concept. Because each `RUN` instruction is cached based on the layer state above it, order matters. Always copy dependency files and install dependencies _before_ copying your application code:

```dockerfile
# Good: dependencies cached separately from code
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY src/ ./src/

# Bad: any code change invalidates the pip install cache
COPY . .
RUN pip install -r requirements.txt
```

## Writing a Dockerfile

For Lambda, AWS provides official base images that include the Python runtime, the **Lambda Runtime Interface Client (RIC)**, and the correct entrypoint. These are the right starting point - using a generic `python:3.12-slim` image requires you to install the RIC yourself.

```dockerfile
# Dockerfile
FROM public.ecr.aws/lambda/python:3.12

# Copy and install dependencies first (cached separately from code)
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy application code
COPY src/ ${LAMBDA_TASK_ROOT}/

# Tell Lambda which function to invoke
CMD ["handler.lambda_handler"]
```

A few Lambda-specific details:

- **`${LAMBDA_TASK_ROOT}`** is an environment variable set by the AWS base image - it points to `/var/task`, the directory Lambda reads your function code from. Always copy your code here.
- **`CMD`** takes the form `["module.function"]` where `module` is the Python file (without `.py`) and `function` is the handler name. `handler.lambda_handler` means Lambda will call `lambda_handler` in `handler.py`.
- The AWS base image sets the `ENTRYPOINT` to the Lambda RIC. You do not need to set it yourself - only override `CMD` with your handler path.

Your `handler.py` looks the same as any other Lambda handler:

```python
# src/handler.py
import json


def lambda_handler(event, context):
    name = event.get("name", "world")
    return {
        "statusCode": 200,
        "body": json.dumps({"message": f"Hello, {name}!"}),
    }
```

## Building and Running Locally

Build and tag the image:

```bash
docker build -t my-lambda .
```

Run it as a standard container to verify it starts without errors:

```bash
docker run -p 9000:8080 my-lambda
```

### Testing with the Lambda Runtime Interface Emulator

Simply running the container starts it, but that doesn't let you invoke the handler the way Lambda would. The **Lambda Runtime Interface Emulator (RIE)** is a local proxy that emulates the Lambda invocation API. AWS base images ship with it built in - it's available at `/usr/local/bin/aws-lambda-rie`.

Run the container with the RIE as the entrypoint:

```bash
docker run -p 9000:8080 \
  --entrypoint /usr/local/bin/aws-lambda-rie \
  my-lambda \
  /usr/local/bin/python -m awslambdaric handler.lambda_handler
```

Then invoke the handler by posting a test event to the local endpoint:

```bash
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"name": "Docker"}'
```

You should get back `{"statusCode": 200, "body": "{\"message\": \"Hello, Docker!\"}"}`. If the handler returns that response locally, it will return the same response in Lambda.

> **Reference project:** The [docker-python-lambda](https://github.com/andrewgilliland/docker-python-lambda) repo has a full FastAPI + Lambda setup with a `Makefile` for building, running locally, and invoking via the RIE - a good starting point if you want working code to reference alongside this article.

## Lambda Container Image Support

When you deploy a container image to Lambda, a few things happen under the hood that are worth knowing:

**ECR is required.** Lambda can only pull images from Amazon ECR (Elastic Container Registry) - not Docker Hub, GitHub Container Registry, or any other registry. Your image must be pushed to an ECR repository in the same AWS account and region as the Lambda function before you can deploy it.

**Lambda caches images at the execution environment level.** When Lambda cold-starts a container image function, it pulls the image from ECR into its internal cache. Subsequent invocations on that warm execution environment don't re-pull. AWS also optimizes image loading using a chunked format - large layers that haven't changed between deployments load faster on subsequent cold starts.

**Cold starts are slower than ZIP.** A container image cold start involves pulling the image layers, extracting them, and initializing the runtime. This is slower than the ZIP extraction path. For a Python function with modest dependencies, the difference is typically a few hundred milliseconds to a couple of seconds. For very large images (>1 GB), cold starts can be several seconds. If consistent low-latency cold starts are critical, ZIP packages are faster - or use Provisioned Concurrency to keep execution environments warm.

**The 10 GB limit is per image, not per layer.** Individual image layers have no hard size limit, but the total uncompressed size of all layers combined must be under 10 GB.

## Packaging ML Dependencies with Docker

The most common reason Python developers reach for container images is ML libraries. Here's what a realistic dependency set looks like:

```text
# requirements.txt
scikit-learn==1.6.1
pandas==2.2.3
numpy==2.2.4
joblib==1.4.2
```

Unzipped, `scikit-learn` + `pandas` + `numpy` together are around 180–200 MB - already near the ZIP limit with nothing else included. Add a serialized model file (even a modest `joblib`-serialized sklearn model can be 50–200 MB) and you're over.

The Dockerfile for this kind of function is straightforward:

```dockerfile
# Dockerfile
FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy model artifact and code
COPY model.joblib ${LAMBDA_TASK_ROOT}/
COPY src/ ${LAMBDA_TASK_ROOT}/

CMD ["handler.lambda_handler"]
```

The handler loads the model once at module load time (outside the handler function) so it's loaded on cold start and reused across warm invocations:

```python
# src/handler.py
import json
import joblib
import numpy as np

# Loaded once on cold start, reused on warm invocations
model = joblib.load("/var/task/model.joblib")


def lambda_handler(event, context):
    features = np.array(event["features"]).reshape(1, -1)
    prediction = model.predict(features)
    return {
        "statusCode": 200,
        "body": json.dumps({"prediction": prediction.tolist()}),
    }
```

> **Note:** If your model artifact is large (>500 MB), consider storing it in S3 and loading it on cold start rather than baking it into the image. Loading from S3 in the same region is fast, and it keeps your image size smaller - which speeds up cold starts and ECR push times.

## Deploying Container Lambdas with CDK

CDK's `DockerImageFunction` construct handles the full deployment: it builds your image, pushes it to ECR, and creates the Lambda function in one step.

```typescript
// infra/stacks/lambda-stack.ts
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const inferenceFunction = new lambda.DockerImageFunction(
      this,
      "InferenceFunction",
      {
        code: lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../"), // directory containing your Dockerfile
        ),
        memorySize: 1024,
        timeout: cdk.Duration.seconds(30),
        description: "ML inference function",
      },
    );
  }
}
```

`DockerImageCode.fromImageAsset()` points at the directory containing your `Dockerfile`. When you run `cdk deploy`, CDK:

1. Builds the Docker image locally using `docker build`
2. Creates an ECR repository in your account if one doesn't exist
3. Pushes the image to that ECR repository
4. Creates the Lambda function referencing the ECR image URI

You do not need to manually create an ECR repository or push the image yourself - CDK handles all of it.

> **Note:** `cdk deploy` requires Docker to be running locally. The build happens on your machine (or in your CI runner) before the image is pushed to ECR.

## Image Size Optimization

Smaller images cold-start faster and push to ECR faster. A few practical optimizations:

**Use `.dockerignore`.** Without it, `docker build` sends your entire project directory to the Docker daemon as build context - including `node_modules`, `.git`, virtual environments, test fixtures, and anything else sitting in your repo. Create a `.dockerignore` at the project root:

```
# .dockerignore
.git
.github
__pycache__
*.pyc
*.pyo
.pytest_cache
.venv
node_modules
*.egg-info
dist
build
```

**Pass `--no-cache-dir` to pip.** pip stores a local cache of downloaded packages to speed up re-installs. Inside a Docker layer, that cache is never reused - it just bloats the image. Always use `--no-cache-dir`:

```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

**Use multi-stage builds to exclude build tools.** Some packages require compilers or header files to build from source but don't need them at runtime. A multi-stage build installs dependencies in a builder stage and copies only the installed packages into the final image:

```dockerfile
# Build stage: has build tools for compiling native extensions
FROM public.ecr.aws/lambda/python:3.12 AS builder

COPY requirements.txt .
RUN pip install --no-cache-dir --target /install -r requirements.txt

# Final stage: only the installed packages, no build tools
FROM public.ecr.aws/lambda/python:3.12

COPY --from=builder /install ${LAMBDA_TASK_ROOT}
COPY src/ ${LAMBDA_TASK_ROOT}/

CMD ["handler.lambda_handler"]
```

**Prefer AWS Lambda base images over generic Python images.** `public.ecr.aws/lambda/python:3.12` already includes the Lambda RIC, the correct entrypoint, and the system libraries Lambda's environment provides. Using `python:3.12-slim` and installing the RIC yourself adds steps and can introduce subtle version mismatches.

## When to Use Containers vs Zip Files

|                      | ZIP package                        | Container image                             |
| -------------------- | ---------------------------------- | ------------------------------------------- |
| **Size limit**       | 50 MB compressed / 250 MB unzipped | 10 GB                                       |
| **Cold start**       | Faster                             | Slower (by hundreds of ms to a few seconds) |
| **ML libraries**     | Usually too large                  | Correct choice                              |
| **Native binaries**  | Fragile (must match Amazon Linux)  | Built in the right environment              |
| **Local dev parity** | Low - your OS vs Amazon Linux      | High - `docker run` mirrors Lambda exactly  |
| **Build toolchain**  | pip + zip                          | Docker required                             |
| **ECR required**     | No                                 | Yes                                         |
| **CDK deploy**       | Straightforward                    | `DockerImageFunction` - slightly more setup |

**Use ZIP when:**

- Your function and dependencies are under ~150 MB unzipped (leave headroom)
- You have no native binary dependencies that need to be compiled
- Fast cold starts matter and you're not using Provisioned Concurrency

**Use container images when:**

- Dependencies include ML libraries, data processing stacks, or anything with native extensions
- You need a consistent local dev/test environment that matches production
- You're bundling a model artifact with your function code
- Your function needs OS-level packages not available in the Lambda runtime

For a deeper look at the ZIP deployment model and Lambda deployment types in general, see [AWS Lambda: What It Is, When to Use It, and How to Deploy It](/articles/intro-to-aws-lambda).

## The Takeaway

Container images solve a specific, well-defined set of Lambda problems: dependency size limits, native binary compatibility, and local environment parity. They're not a general upgrade over ZIP packages - ZIP is simpler, faster to cold-start, and the right default for most Lambda functions. But once your Python dependencies grow past what ZIP can hold, or you need to bundle a trained model with your function, containers are the straightforward path forward. The tooling - AWS base images, the Lambda RIE for local testing, and CDK's `DockerImageFunction` - makes the setup less painful than it sounds.
