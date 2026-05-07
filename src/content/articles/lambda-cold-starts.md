---
title: Lambda Cold Starts
date: 2026-05-06
excerpt: What happens during a Lambda cold start, how to measure it with X-Ray and CloudWatch Logs Insights, and how to reduce it with lean packages, init code patterns, and provisioned concurrency.
draft: false
tags: ["aws", "serverless", "python", "cdk"]
---

Cold starts are the most discussed Lambda limitation. A cold start is what happens when Lambda has no warm execution environment available and has to build one from scratch before running your code. Understanding what that actually involves - and where the time goes - makes it a lot easier to know when to care and what to do about it.

This article breaks down the three phases of a cold start, shows how to measure yours with X-Ray and CloudWatch Logs Insights, and covers every meaningful mitigation: leaner packages, better init patterns, and provisioned concurrency.

## What Happens During a Cold Start

Every Lambda invocation runs inside an execution environment - a lightweight micro-VM running on AWS's Firecracker hypervisor. On a warm invocation, that environment already exists and Lambda just calls your handler. On a cold start, Lambda has to create the environment first. That creation happens in three sequential phases.

**Phase 1: Container init.** AWS provisions the micro-VM, sets up the execution environment filesystem, and downloads your deployment package (ZIP or container image) from S3 or ECR. This phase is entirely under AWS's control - you can't speed it up directly, but smaller packages download faster.

**Phase 2: Runtime init.** AWS starts the language runtime. For Python, this means launching the Python interpreter and loading Lambda's runtime bootstrap. For compiled languages like Java, this is where the JVM starts - which is why Java cold starts are notoriously slow compared to Python and Node.js.

**Phase 3: Function init.** AWS executes all code outside your handler function. Every import at the top of your file, every module-level variable, every connection or model you initialize at the global scope - it all runs here. This is the phase you have the most control over.

```python
import boto3          # ← runs during function init
import pandas as pd   # ← runs during function init (slow)

s3 = boto3.client("s3")   # ← runs during function init
df = pd.read_csv("data.csv")  # ← runs during function init

def handler(event, context):
    # ← only code here runs on warm invocations
    pass
```

After all three phases complete, Lambda calls your handler. The total time from "no environment exists" to "handler starts running" is the cold start duration. On warm invocations, phases 1–3 are skipped entirely.

## What Triggers a Cold Start

Cold starts don't happen on every request. They happen in four situations:

**First invocation.** When no execution environment exists yet - the function just deployed or hasn't been invoked recently.

**Scaling out.** Lambda runs concurrent invocations in separate environments. If your function is already handling 10 requests and an 11th arrives simultaneously, Lambda spins up a new environment for it. That 11th invocation gets a cold start even if the others are warm.

**After an idle period.** Lambda recycles execution environments that haven't been used recently. The exact window isn't documented, but environments typically stay warm for 5–15 minutes of inactivity. After that, the next invocation starts cold.

**After a deployment.** When you deploy a new version of your function, Lambda creates fresh environments for it. In-flight warm environments running the old version don't carry over.

If your function receives a steady stream of traffic, most invocations are warm. Cold starts show up at the edges - at startup, during traffic spikes, and for low-traffic functions that sit idle between calls.

## How Long Do They Take

Cold start duration is dominated by two things: package size and what's in your module-level init code.

For Python functions, rough benchmarks on a ZIP deployment:

| Function profile                         | Typical cold start |
| ---------------------------------------- | ------------------ |
| Minimal (just `boto3`, standard library) | 100–300ms          |
| Medium (a few third-party libraries)     | 300–800ms          |
| Heavy (pandas, numpy, scikit-learn)      | 1–4s               |
| Container image (medium dependencies)    | 2–6s               |

Container images cold-start slower than ZIP packages because Lambda has to pull the image layers from ECR before starting the runtime. ZIP packages are extracted in-place, which is faster.

VPC-attached functions used to have dramatically longer cold starts (8–15 seconds) due to on-demand elastic network interface provisioning. AWS resolved this in 2019 with Hyperplane ENIs - network interfaces are now provisioned when the function is deployed, not at cold-start time. VPC and non-VPC cold starts are now roughly comparable. Don't avoid VPC for cold-start reasons alone.

## Measuring Cold Starts

Lambda logs a `REPORT` line at the end of every invocation that includes timing metrics. On a cold start, that line includes an extra `Init Duration` field:

```
REPORT RequestId: abc-123  Duration: 42.13 ms  Billed Duration: 43 ms  Memory Size: 512 MB  Max Memory Used: 88 MB  Init Duration: 412.55 ms
```

`Init Duration` is the time spent in all three init phases. If it's absent, the invocation was warm.

### CloudWatch Logs Insights

To query cold start frequency and duration across invocations, use CloudWatch Logs Insights against your function's log group:

```
filter @message like /Init Duration/
| parse @message "Init Duration: * ms" as initDuration
| stats
    count() as coldStarts,
    avg(initDuration) as avgMs,
    pct(initDuration, 50) as p50Ms,
    pct(initDuration, 99) as p99Ms
  by bin(1h)
```

Run this in the CloudWatch console (Logs → Logs Insights, select your `/aws/lambda/<function-name>` log group). It gives you cold start count and percentile latency broken down by hour - useful for correlating cold start spikes with traffic patterns.

### X-Ray Tracing

Enable X-Ray active tracing to get a visual breakdown of cold start phases per invocation. In CDK:

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";

const fn = new lambda.Function(this, "MyFunction", {
  runtime: lambda.Runtime.PYTHON_3_13,
  handler: "handler.main",
  code: lambda.Code.fromAsset("lambda"),
  tracing: lambda.Tracing.ACTIVE,
});
```

With tracing enabled, Lambda emits a trace for every invocation. In the X-Ray console (or CloudWatch ServiceLens), cold-start invocations show an `Initialization` segment before the `Invocation` segment. You can see exactly how long container init, runtime init, and function init took for each cold start.

## Reducing Cold Start Duration

### Keep Packages Lean

Package size directly affects how long container init takes. Smaller ZIP = faster download = shorter cold start.

Audit your dependencies. `pandas` pulls in `numpy`, `python-dateutil`, `pytz`, and several other packages even if you only use one feature. If you're reading a CSV and doing basic filtering, `csv` from the standard library might be sufficient. If you need pandas, import it - but don't import it if you don't.

Remove dev dependencies from your deployment package. Test libraries, formatters, and type stubs have no place in a Lambda ZIP. Use a separate `requirements.txt` for Lambda vs. local development, or use dependency groups with `uv`:

```bash
# Install only production dependencies into the Lambda package
uv pip install -r requirements.txt --no-dev -t lambda/
```

For data science workloads where large packages are unavoidable, consider container images - they support up to 10 GB and Lambda caches image layers, so only changed layers are re-pulled on deployment.

**Watch out for web frameworks.** FastAPI, Flask, and Django are a common source of unexpected cold start overhead. FastAPI alone pulls in Starlette, Pydantic v2, AnyIO, and several transitive dependencies — a minimal FastAPI handler with [Mangum](https://github.com/jordaneremieff/mangum) (the ASGI adapter for Lambda) typically cold-starts in 500ms–1.5s, compared to under 300ms for an equivalent plain Lambda handler. The framework's routing layer is also largely redundant when API Gateway is already handling routing upstream. If you need request validation, Pydantic alone is significantly lighter than the full FastAPI stack. If you need structured logging, tracing, and event parsing, [AWS Lambda Powertools for Python](https://docs.powertools.aws.dev/lambda/python/) is purpose-built for Lambda and adds minimal import weight.

### Move Expensive Init Outside the Handler

Code at module level runs once per execution environment and is reused across all warm invocations. Code inside the handler runs on every invocation. Put expensive one-time setup at module level:

```python
import boto3
import psycopg2

# ✅ Runs once per environment - DB connection reused across warm invocations
_conn = psycopg2.connect(...)
_s3 = boto3.client("s3")

def handler(event, context):
    # ✅ Uses already-initialized resources
    result = _conn.execute("SELECT ...")
    return {"statusCode": 200, "body": str(result)}
```

This pattern also applies to ML models. Loading a model from S3 inside the handler means every invocation pays the download cost. Load it at module level and it's downloaded once:

```python
import boto3
import pickle

s3 = boto3.client("s3")

# Load model once per environment
_obj = s3.get_object(Bucket="my-bucket", Key="model.pkl")
_model = pickle.loads(_obj["Body"].read())

def handler(event, context):
    features = extract_features(event)
    prediction = _model.predict([features])
    return {"statusCode": 200, "body": str(prediction[0])}
```

The tradeoff: module-level init runs during every cold start, which means the cold start is slower. But warm invocations are faster, and in most cases warm invocations vastly outnumber cold starts. Optimize for the common path.

### Lazy Imports

For code paths that are rarely hit, you can delay imports until they're needed:

```python
def handler(event, context):
    action = event.get("action")

    if action == "report":
        import pandas as pd  # ← only imported when action == "report"
        df = pd.DataFrame(...)
        return generate_report(df)

    return {"statusCode": 200, "body": "ok"}
```

This keeps the cold start fast for the common case (`action != "report"`) by not importing pandas during function init. The tradeoff is that the first invocation hitting the `report` path pays the import cost mid-invocation, which shows up as a slow handler execution rather than a slow cold start. Use this when the heavy code path is rare and latency on that path is less critical.

### Use ZIP Over Container Images When Possible

ZIP packages cold-start noticeably faster than container images because Lambda doesn't need to pull image layers from ECR. If your total unzipped dependencies fit within the 250 MB limit, use ZIP.

Container images make sense when:

- You need more than 250 MB of dependencies (common with ML)
- You need custom OS libraries that can't be included in a ZIP layer
- You want a consistent local dev environment with Docker

For everything else, ZIP is faster to deploy and faster to cold-start.

## Provisioned Concurrency

All the techniques above reduce cold start duration. Provisioned Concurrency eliminates it.

When you configure provisioned concurrency, Lambda pre-initializes N execution environments and keeps them permanently warm. Invocations routed to those environments skip all three init phases and go straight to your handler. No cold start, every time.

Configure it in CDK using a function alias:

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";

const fn = new lambda.Function(this, "MyFunction", {
  runtime: lambda.Runtime.PYTHON_3_13,
  handler: "handler.main",
  code: lambda.Code.fromAsset("lambda"),
  tracing: lambda.Tracing.ACTIVE,
});

const version = fn.currentVersion;

const alias = new lambda.Alias(this, "LiveAlias", {
  aliasName: "live",
  version,
  provisionedConcurrentExecutions: 5,
});
```

**`fn.currentVersion`** creates an immutable version snapshot of the function. Provisioned concurrency must be set on an alias or version - not on the `$LATEST` version directly.

**`provisionedConcurrentExecutions: 5`** tells Lambda to keep 5 environments permanently initialized. The first 5 concurrent invocations always hit a warm environment. A 6th concurrent invocation would get a normal cold start unless you provision more.

The cost tradeoff is real: you pay for provisioned concurrency by the hour even when your function receives zero traffic. At 5 environments for a 512 MB function, that's roughly $15–20/month in `us-east-1` at current pricing, on top of normal invocation costs. Check the [Lambda pricing page](https://aws.amazon.com/lambda/pricing/) for current rates before committing.

Provisioned concurrency is the right choice when:

- You have a user-facing API with a p99 latency SLA that cold starts would violate
- Your function has heavy init code (ML model loading, large package imports) that can't be eliminated
- Traffic is predictable enough that you know how many environments to provision

It's overkill for:

- Async workloads (SQS consumers, S3 processors) where a few hundred milliseconds of cold start doesn't matter
- Low-traffic internal tools
- Functions that already cold-start in under 200ms

### Application Auto Scaling

For variable traffic, you can combine provisioned concurrency with Application Auto Scaling to adjust the provisioned count based on utilization:

```typescript
import * as appscaling from "aws-cdk-lib/aws-applicationautoscaling";

const scalingTarget = new appscaling.ScalableTarget(this, "ScalingTarget", {
  serviceNamespace: appscaling.ServiceNamespace.LAMBDA,
  resourceId: `function:${fn.functionName}:live`,
  scalableDimension: "lambda:function:ProvisionedConcurrency",
  minCapacity: 2,
  maxCapacity: 20,
});

scalingTarget.scaleToTrackMetric("UtilizationTracking", {
  targetValue: 0.7,
  predefinedMetric:
    appscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
});
```

This scales provisioned concurrency up when utilization exceeds 70% and back down when traffic drops. It handles traffic ramps without you manually adjusting the provisioned count.

## SnapStart (Java)

If you ever evaluate Java-based Lambda functions, SnapStart is worth knowing about. Java cold starts are slow because the JVM has to start, load classes, and JIT-compile hot paths before the function is ready. SnapStart addresses this by snapshotting the initialized JVM state after function init completes, then restoring from that snapshot on cold starts instead of re-initializing from scratch.

SnapStart is specific to the Java 11 and Java 17 managed runtimes. It has no equivalent for Python - Python cold starts are fast enough that a snapshot mechanism isn't necessary. If you're working in Python, you won't encounter it.

## When Cold Starts Don't Matter

Cold start optimization is worth your time when it's a user-facing problem. For many Lambda use cases, it isn't.

**Async event processors** - SQS consumers, S3 event processors, EventBridge rules, Step Functions tasks - are never user-facing. A 2-second cold start on a background job that processes uploaded files doesn't affect any user experience. Don't optimize for it.

**Scheduled Lambda functions** (EventBridge cron) run on a schedule and are almost always cold. If the job runs once per hour, provisioned concurrency would keep it warm 59 minutes out of every 60 for no reason. Accept the cold start.

**Internal tooling and low-traffic APIs** that don't have latency SLAs. A Lambda-backed admin API that 3 engineers invoke 10 times a day doesn't need provisioned concurrency.

**High-traffic APIs** where Lambda is already warm across all concurrent environments. At sustained high concurrency, the fraction of requests that hit a cold start becomes negligible. Focus on hot-path optimization instead.

## The Takeaway

- **Cold starts happen during environment creation, not on every invocation.** Warm invocations skip all three init phases and run only your handler.
- **Function init is the phase you control most.** What you put at module level runs during every cold start. Expensive init (model loading, DB connections) belongs there - it's amortized across warm invocations. Unnecessary imports don't.
- **Measure before optimizing.** Use the `Init Duration` field in CloudWatch Logs or X-Ray traces to see actual cold start durations for your function before deciding what to fix.
- **Package size matters.** Smaller ZIP = faster container init. Audit dependencies and don't include what you don't use.
- **VPC no longer causes slow cold starts.** Hyperplane ENIs resolved this in 2019. Don't avoid VPC for cold-start reasons.
- **Provisioned concurrency eliminates cold starts but costs money.** Use it for user-facing APIs with latency SLAs. Skip it for async workloads, scheduled functions, and internal tools.
- **Most cold starts don't need fixing.** Async workloads, background jobs, and low-traffic APIs are fine with cold starts. Optimize where users actually feel it.

For a broader overview of Lambda, [AWS Lambda: What It Is, When to Use It, and How to Deploy It](/articles/intro-to-aws-lambda) covers the core model, runtimes, and deployment options. For Lambda connecting to PostgreSQL - where cold starts combine with connection setup latency - [Lambda with RDS Proxy](/articles/lambda-with-rds-proxy) covers the full setup. For observability beyond cold start measurement, [Monitoring and Observability on AWS](/articles/monitoring-and-observability-on-aws) covers CloudWatch, X-Ray, and alarms in depth.
