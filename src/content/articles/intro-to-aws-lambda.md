---
title: "AWS Lambda: What It Is, When to Use It, and How to Deploy It"
date: 2026-03-29
excerpt: Lambda is AWS's serverless compute service - run code without managing servers, pay only for what you use. Here's what it is, why it's worth knowing, when to reach for something else, and how to deploy it with CDK.
draft: false
tags: ["aws", "serverless", "cdk"]
---

## What Is AWS Lambda?

Lambda is AWS's serverless compute service. You write a function, deploy it, and AWS handles everything else - the server, the operating system, the runtime environment, and scaling. When an event triggers your function, Lambda initializes an execution environment, runs your code, and tears it down when it's done. You pay only for the time your code is actually running, measured in milliseconds.

The core model is this: your code lives inside a **handler function** that Lambda invokes with two arguments - `event` (the triggering payload, which varies by event source) and `context` (runtime metadata like the function name, memory limit, and request ID). The handler runs, returns a result or produces a side effect, and exits. Lambda manages everything around that.

A few hard limits worth knowing upfront:

- **Maximum execution duration: 15 minutes.** Lambda is designed for short-lived work. Anything longer needs a different tool.
- **Stateless by default.** Lambda doesn't persist local state between invocations. Two concurrent invocations of the same function are entirely separate environments.
- **Memory: 128 MB to 10 GB**, with CPU scaling proportionally. At 1 GB you get roughly 2 vCPUs; at 10 GB you get 6 vCPUs.
- **Ephemeral local disk: 512 MB to 10 GB** in `/tmp`, discarded after the execution environment is recycled.

## Why Use Lambda

Lambda's value is highest when your compute needs are intermittent, event-triggered, or highly variable in load.

**API backends and webhooks.** Pair Lambda with API Gateway or a Function URL and you have a fully serverless HTTP endpoint. Lambda scales automatically from zero requests to thousands of concurrent requests without you provisioning anything, and you pay nothing when it's idle.

**Event-driven processing.** Lambda integrates natively with almost every AWS service as a downstream processor. An S3 upload triggers a function that processes the file. An SQS queue delivers messages to a function that handles each batch. An EventBridge rule fires a function on a schedule or in response to a system event. The function doesn't run a polling loop - the event source invokes it.

**Scheduled tasks.** EventBridge Scheduler replaces cron jobs. Define a recurring schedule, target a Lambda function, and you have a managed cron with built-in retry handling and monitoring.

**Glue code between services.** Lambda works well as the glue layer in event-driven architectures - receiving an event from one service, transforming or enriching the payload, and forwarding it to another. The functions stay small, focused, and easy to reason about.

**Intermittent or spiky workloads.** If your background processing job runs once an hour for 30 seconds, running a 24/7 EC2 instance for that job is wasteful. Lambda's per-invocation pricing makes it cost-effective for anything that doesn't need to be on constantly.

## Why NOT Use Lambda

Lambda is not a general-purpose compute platform. It has real constraints, and knowing them upfront saves you from redesigning something halfway through a build.

**The 15-minute timeout is a hard ceiling.** Lambda cannot run longer than 15 minutes. Long-running data transformations, batch jobs, model training, multi-step workflows - if any of those exceed the window, Lambda can't carry them alone. Use Step Functions to orchestrate Lambda across multiple steps, or use ECS Fargate for tasks that just need to run until they're done.

**Cold starts add latency at unpredictable moments.** When Lambda has no warm execution environment available, it initializes a new one. This involves pulling your code package, starting the runtime, and executing any initialization code outside your handler. Warm invocations reuse an existing environment and are fast. Cold starts range from tens of milliseconds for small Python or Node.js functions to several seconds for large packages or JVM-based runtimes. VPC-attached functions used to have dramatically longer cold starts (8–15 seconds) due to on-demand ENI provisioning, but AWS resolved this in 2019 with Hyperplane ENIs - network interfaces are now provisioned when the function is deployed, not at cold-start time, so VPC and non-VPC cold starts are comparable. For user-facing APIs where cold-start latency is unacceptable, you need Provisioned Concurrency - which comes with an always-on cost.

**Lambda is not a persistent connection server.** You can't host a WebSocket server on it. You can't hold open a long-lived streaming connection. Lambda's model is fundamentally one invocation, one lifecycle - request in, response out. For persistent connections, use API Gateway WebSocket APIs (which manage connection state externally) or a traditional server-based compute tier.

**Database connection limits become a problem at scale.** Each Lambda execution environment opens its own database connections. If you have 500 concurrent Lambda invocations all hitting a PostgreSQL instance, you have 500 open connections - and most PostgreSQL instances are configured for far fewer. RDS Proxy solves this by pooling connections between Lambda and the database, but it adds cost and operational overhead. If you have a workload that needs high connection throughput to a relational database, a traditional server-based architecture with a connection pool may be simpler.

**CPU-intensive or memory-intensive workloads have a ceiling.** 10 GB of RAM and 6 vCPUs is not enough for video transcoding, large-batch ML inference, or high-throughput numerical computation. Use ECS, Batch, or SageMaker for those workloads.

**Observability requires deliberate setup.** CloudWatch Logs captures stdout/stderr by default, but that's it. Correlating logs across invocations, debugging cold starts, and tracing a request through multiple Lambda functions requires X-Ray, Lambda Powertools, and intentional instrumentation. It's not hard to set up, but it doesn't happen automatically.

## Lambda Options

### Runtimes

Lambda manages the execution runtime for you. You choose one:

| Runtime                            | When to use                                                                                                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js 22**                     | TypeScript and JavaScript - fast cold starts, large npm ecosystem                                                                                                                |
| **Python 3.13**                    | Python - fast cold starts, great for data processing and AWS SDK usage                                                                                                           |
| **Java 21**                        | Java and Kotlin - Kotlin compiles to JVM bytecode, no custom runtime needed; use SnapStart to reduce cold starts                                                                 |
| **.NET 8**                         | C#                                                                                                                                                                               |
| **Ruby 3.3**                       | Ruby                                                                                                                                                                             |
| **Go (`provided.al2023`)**         | Go - AWS deprecated the managed `go1.x` runtime in 2023; compile to a static `bootstrap` binary and deploy on `provided.al2023`; very fast cold starts                           |
| **Rust (`provided.al2023`)**       | Rust - no managed runtime; use the official `lambda_runtime` crate and deploy as a custom runtime binary; minimal memory footprint and some of the fastest cold starts available |
| **PHP (`provided.al2023` + Bref)** | PHP - no managed runtime; [Bref](https://bref.sh) is the standard open-source layer that brings PHP, Laravel, and Symfony to Lambda                                              |
| **Container image**                | Any language and dependency set, up to 10 GB image size - useful for large ML dependencies, custom OS layers, or consistent local Docker development                             |

AWS manages patching, security updates, and deprecation schedules for managed runtimes. Once a runtime reaches end of life, Lambda blocks new deployments to it and eventually restricts invocations. Custom runtimes (`provided.al2023`) work by requiring a `bootstrap` executable in your deployment package that implements the [Lambda Runtime API](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) - a simple HTTP polling loop that fetches events, invokes your handler, and posts the response.

### Deployment Types

**ZIP package** is the default. Your code and its dependencies are bundled into a ZIP file that Lambda extracts into the execution environment. The limit is 50 MB compressed, 250 MB unzipped. ZIP packages are fast to upload, fast to update, and fast to cold-start because the extraction is lightweight. This is the right choice for most Lambda functions.

**Container image** packages your function as a Docker image, up to 10 GB. The image includes your code, runtime, dependencies, and any OS-level libraries you need. Container images are useful when your dependencies exceed ZIP size limits (common with ML libraries like PyTorch or scikit-learn with model weights), when you need a custom OS layer, or when you want a consistent local development experience with `docker run`. Cold starts are slower for container images because the image needs to be pulled and initialized.

### Trigger Types

Lambda functions don't run on a schedule by default - they're invoked by an event source. Every event source follows one of two delivery models:

**Push-based**: the event source calls Lambda's `Invoke` API directly when something happens.
**Poll-based (Event Source Mapping)**: Lambda itself polls the source on your behalf and invokes your function with batches of records.

| Trigger                     | Model                   | Common Use                                       |
| --------------------------- | ----------------------- | ------------------------------------------------ |
| API Gateway REST / HTTP API | Push                    | HTTP request handling, REST APIs                 |
| Function URL                | Push                    | Simple HTTP endpoint, no API Gateway needed      |
| S3 bucket notification      | Push                    | File processing on upload, thumbnail generation  |
| EventBridge rule / schedule | Push                    | Scheduled tasks, cross-service event routing     |
| Amazon SQS                  | Event Source Mapping    | Queue consumers, decoupled background processing |
| DynamoDB Streams            | Event Source Mapping    | Change data capture, real-time sync              |
| Kinesis                     | Event Source Mapping    | Stream processing, log aggregation               |
| SNS topic                   | Push (via subscription) | Fan-out processing, notifications                |

Understanding the delivery model matters for error handling. With push-based triggers, the event source retries on Lambda throttling. With Event Source Mappings, Lambda controls the polling loop, batch size, and retry behavior, and failed batches can be routed to a dead-letter queue.

## CDK Implementation

The CDK construct for Lambda is `lambda.Function`. The three things it always needs: a runtime, a handler path, and a code asset pointing to the directory with your function code.

### Python Handler - CDK (Python) + Python 3.13 Runtime

```python
from aws_cdk import Stack, Duration
from aws_cdk import aws_lambda as lambda_
from constructs import Construct

class MyStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        fn = lambda_.Function(self, "HelloFn",
            runtime=lambda_.Runtime.PYTHON_3_13,
            handler="handler.main",  # file: handler.py, function: main
            code=lambda_.Code.from_asset("lambda"),
            memory_size=256,
            timeout=Duration.seconds(30),
            environment={
                "STAGE": "prod",
            },
        )
```

The `handler` string is `<filename>.<function_name>`. With `handler: 'handler.main'`, Lambda expects a file called `handler.py` with a function called `main`.

```python
# lambda/handler.py
import json

def main(event, context):
    print(f"Received event: {json.dumps(event)}")
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Hello from Lambda"}),
    }
```

### TypeScript Handler - CDK (TypeScript) + Node.js 22 Runtime

Same construct, now in TypeScript CDK with the Node.js 22 runtime:

```typescript
const fn = new lambda.Function(this, "HelloFn", {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "handler.main", // file: handler.js, export: main
  code: lambda.Code.fromAsset("lambda"),
  memorySize: 256,
  timeout: cdk.Duration.seconds(30),
  environment: {
    STAGE: "prod",
  },
});
```

Lambda expects a file called `handler.js` (or `handler.mjs`) with an exported function called `main`. If you write in TypeScript, compile to JavaScript before deploying - or use `aws-lambda-nodejs` from `@aws-cdk/aws-lambda-nodejs` which handles the bundling automatically.

```typescript
// lambda/handler.ts (compiled to handler.js at deploy time)
export const main = async (event: any) => {
  console.log("Received event:", JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from Lambda" }),
  };
};
```

### Adding a Function URL

A Function URL gives your Lambda an HTTPS endpoint without API Gateway. It's the simplest way to invoke a Lambda from HTTP:

```typescript
const fnUrl = fn.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.AWS_IAM, // or NONE for public
  cors: {
    allowedOrigins: ["https://yourdomain.com"],
    allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
  },
});

new cdk.CfnOutput(this, "FunctionUrl", { value: fnUrl.url });
```

Use `FunctionUrlAuthType.NONE` only for public endpoints. For internal service-to-service calls, `AWS_IAM` requires the caller to sign requests with SigV4, which is effectively free authentication for AWS services calling each other.

### Granting Permissions

Lambda functions get an execution role automatically, but that role has no permissions by default - it can only write logs to CloudWatch. To give a function access to other AWS resources, use the CDK `grant*` methods where available, or `addToRolePolicy` when you need something more specific:

```typescript
import * as iam from "aws-cdk-lib/aws-iam";

// Grant read access to a specific S3 bucket
bucket.grantRead(fn);

// Grant write access to a DynamoDB table
table.grantWriteData(fn);

// Custom policy statement for anything without a grant method
fn.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["secretsmanager:GetSecretValue"],
    resources: [secret.secretArn],
  }),
);
```

Prefer `grant*` methods over raw `PolicyStatement` where they exist - they scope permissions to the specific resource ARN automatically. Avoid `*` resources in Lambda execution role policies; Lambda should only access exactly what it needs.

## The Takeaway

- **Lambda is a great fit when work is short, event-triggered, and stateless.** API backends, queue consumers, file processors, scheduled tasks, and service glue code are its home territory.
- **The 15-minute timeout and stateless model are not limitations to work around - they're the design.** If your function needs persistent state or long-running execution, you've outgrown Lambda for that use case.
- **Cold starts are the primary operational gotcha.** Size your deployment package, pick a fast-starting runtime (Python or Node.js), and enable Provisioned Concurrency only on the specific functions where cold-start latency affects users.
- **The execution role is the security boundary.** Never embed AWS credentials in Lambda code or environment variables. Grant the minimum permissions Lambda needs using CDK's `grant*` methods and `addToRolePolicy`.
- **ZIP vs container is usually an easy choice.** ZIP packages are faster and simpler for most functions. Reach for container images only when your dependencies exceed ZIP size limits or you need custom OS libraries.
- **Choose your trigger model deliberately.** Push-based triggers (API Gateway, S3, EventBridge) are simpler to reason about. Poll-based Event Source Mappings (SQS, Kinesis) give you control over batch processing and failure handling.
