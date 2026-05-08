---
title: Structuring a Lambda API for Performance
date: 2026-05-07
excerpt: The architecture decisions that make a Lambda-backed API fast - per-route function layout, lean handlers, per-function dependencies, ARM64, and CDK patterns that compound into short cold starts.
draft: false
tags: ["aws", "serverless", "python", "cdk"]
---

[Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda) covers the mechanics of wiring up an HTTP API - routes, Lambda handlers, DynamoDB, CDK. This article is about the decisions that make that API fast.

Cold start duration isn't determined by one thing. It's the product of several compounding factors: how many packages your function imports, how much code runs at module level, how much memory Lambda allocates, which CPU architecture you're running on, whether your deployment package contains things it doesn't need. Each decision shaves off milliseconds. Together they're the difference between a 1.2s cold start and a 150ms cold start.

This article uses an Events API as a concrete example - four routes, four Lambda functions, DynamoDB as the backend - and walks through every structural decision that affects cold start time.

## What We're Building

An Events API with four routes:

| Method   | Path           | Handler           |
| -------- | -------------- | ----------------- |
| `GET`    | `/events`      | `list_events.py`  |
| `POST`   | `/events`      | `create_event.py` |
| `GET`    | `/events/{id}` | `get_event.py`    |
| `DELETE` | `/events/{id}` | `delete_event.py` |

Each route maps to exactly one Lambda function. The functions are small, independent, and carry only the dependencies they actually need.

## Project Structure

The biggest structural decision is whether functions share a single deployment package or each have their own. The answer is their own.

```
events-api/
├── lambdas/
│   ├── list_events/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── create_event/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── get_event/
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── delete_event/
│       ├── handler.py
│       └── requirements.txt
├── shared/
│   └── utils.py              # response helpers, copied into each function at build time
├── lib/
│   └── api-stack.ts          # CDK stack
├── bin/
│   └── events-api.ts
├── cdk.json
└── package.json
```

Each function directory contains exactly what that function needs. `list_events/requirements.txt` might only have `boto3` (or nothing at all, since boto3 is available in the Lambda runtime). `create_event/requirements.txt` might add `pydantic` for request validation. A future analytics route that needs `pandas` gets its own directory with its own heavy requirements — its package size doesn't affect any other function.

Contrast this with a monolith Lambda where a single handler routes all requests internally. That single package has to include every dependency any route needs. A route that only does a DynamoDB `get_item` still imports pandas at cold start time because another route needs it. The cold start is the sum of all routes' init costs, paid on every cold start, regardless of which route was actually called.

## Handler Pattern

Every handler in this API follows the same structure:

```python
# lambdas/get_event/handler.py
import json
import os
import boto3

# ✅ Module-level init — runs once per environment, reused across warm invocations
_dynamodb = boto3.resource("dynamodb")
_table = _dynamodb.Table(os.environ["TABLE_NAME"])

def main(event, context):
    event_id = event["pathParameters"]["id"]

    response = _table.get_item(Key={"pk": f"EVENT#{event_id}"})
    item = response.get("Item")

    if not item:
        return _response(404, {"error": "Event not found"})

    return _response(200, item)

def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
```

Three things to notice:

**The boto3 client is initialized at module level.** This runs once when the execution environment is created and is reused on every warm invocation. If you initialize the client inside `main()`, Lambda creates a new client object on every single invocation — warm or cold — for no reason.

**Environment variables are read at module level too.** `os.environ["TABLE_NAME"]` at module level reads the env var once. Inside the handler it reads it on every call. For env vars this is a micro-optimization, but the pattern matters — anything that doesn't change between invocations belongs at module level.

**The handler function is named `main`, not `handler`.** This is a convention choice. The CDK config sets `handler: "handler.main"` (module `handler`, function `main`). Using `handler` as both the module name and function name creates a confusing collision. `handler.main` is unambiguous.

Here's the same pattern for the write path:

```python
# lambdas/create_event/handler.py
import json
import os
import uuid
import boto3

_table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def main(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON"})

    name = body.get("name")
    if not name:
        return _response(400, {"error": "name is required"})

    event_id = str(uuid.uuid4())
    item = {
        "pk": f"EVENT#{event_id}",
        "id": event_id,
        "name": name,
    }

    _table.put_item(Item=item)
    return _response(201, item)

def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
```

`uuid` and `json` are standard library modules — no package size cost, no install step. Reach for the standard library first before adding a dependency.

## Per-Function Dependencies

Each function has its own `requirements.txt`. For most CRUD handlers backed by DynamoDB, that file is nearly empty:

```
# lambdas/get_event/requirements.txt
# boto3 is provided by the Lambda runtime — do not bundle it
```

`boto3` is pre-installed in every Lambda execution environment. Bundling it in your deployment package adds ~10 MB to every ZIP for no benefit. Exclude it explicitly from your install step:

```bash
# Install dependencies into the function directory, excluding boto3
pip install -r requirements.txt --target lambdas/get_event/ --no-deps boto3
```

For a function that needs request validation with Pydantic:

```
# lambdas/create_event/requirements.txt
pydantic==2.7.1
```

Pydantic v2 alone (with its Rust core) is roughly 3–4 MB. That's acceptable. Adding FastAPI on top brings in Starlette, AnyIO, and several more packages — pushing the total past 15 MB — for a routing layer you don't need because API Gateway already routes requests before Lambda is invoked. [The cold starts article](/articles/lambda-cold-starts) covers the framework overhead in detail.

CDK's `lambda.Code.fromAsset()` bundles everything in the function directory into the deployment ZIP. Dependencies installed with `--target` end up in the same directory as the handler and get bundled automatically.

## CDK Stack

Define a `commonProps` object for settings shared across all functions, then spread it into each `Function` definition:

```typescript
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "EventsTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const commonProps: Omit<lambda.FunctionProps, "handler" | "code"> = {
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE_NAME: table.tableName,
      },
    };

    const listEvents = new lambda.Function(this, "ListEvents", {
      ...commonProps,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambdas/list_events"),
    });

    const createEvent = new lambda.Function(this, "CreateEvent", {
      ...commonProps,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambdas/create_event"),
    });

    const getEvent = new lambda.Function(this, "GetEvent", {
      ...commonProps,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambdas/get_event"),
    });

    const deleteEvent = new lambda.Function(this, "DeleteEvent", {
      ...commonProps,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambdas/delete_event"),
    });

    // Grant each function only the DynamoDB permissions it needs
    table.grantReadData(listEvents);
    table.grantReadData(getEvent);
    table.grantWriteData(createEvent);
    table.grantWriteData(deleteEvent);

    const api = new apigatewayv2.HttpApi(this, "EventsApi", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.DELETE,
        ],
        allowHeaders: ["Content-Type"],
      },
    });

    api.addRoutes({
      path: "/events",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "ListEventsInt",
        listEvents,
      ),
    });

    api.addRoutes({
      path: "/events",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "CreateEventInt",
        createEvent,
      ),
    });

    api.addRoutes({
      path: "/events/{id}",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "GetEventInt",
        getEvent,
      ),
    });

    api.addRoutes({
      path: "/events/{id}",
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new integrations.HttpLambdaIntegration(
        "DeleteEventInt",
        deleteEvent,
      ),
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url ?? "" });
  }
}
```

A few decisions baked into this stack worth calling out explicitly.

## ARM64 (Graviton)

`lambda.Architecture.ARM_64` is one of the highest-value CDK lines you can write. Graviton-based Lambda functions:

- **Cost 20% less** per GB-second than x86
- **Cold-start faster** — Python's interpreter initializes slightly faster on ARM
- **Run on AWS-designed silicon** purpose-built for steady throughput workloads

The only reason not to use ARM64 is a binary dependency that doesn't have an ARM wheel available. For pure-Python code and `boto3`, there's no reason to stay on x86. Switch any existing Lambda to ARM64 by changing one line in CDK — no code changes required.

## Memory and CPU

Lambda doesn't let you configure CPU directly. CPU is allocated proportionally to memory:

| Memory | Approximate vCPUs |
| ------ | ----------------- |
| 128 MB | 0.25 vCPU         |
| 512 MB | ~1 vCPU           |
| 1 GB   | ~2 vCPU           |
| 2 GB   | ~4 vCPU           |

More CPU doesn't just make your handler run faster — it makes **function init run faster**. Python's module-level code runs on the CPU during phase 3 of the cold start. At 128 MB (0.25 vCPU), function init is measurably slower than at 512 MB, even if your handler barely uses any CPU.

For most CRUD API functions, **512 MB is the right default**. It gives you a full vCPU equivalent, which means fast init code and reasonable handler performance, without paying for memory headroom you don't use. Bump to 1 GB for functions doing non-trivial computation (sorting large result sets, JSON serialization of big responses). For pure I/O-bound handlers that just proxy DynamoDB calls, 512 MB is plenty.

Don't set 128 MB in production to save money. At 128 MB you're paying less per GB-second, but your function runs slower and cold-starts longer. At 512 MB you often pay less total cost because duration drops more than price per unit increases. The [AWS Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning) tool can find the memory setting that minimizes cost and latency for your specific function.

## Shared Code Without a Framework

The `_response()` helper is duplicated across handlers in the example above. For a small API that's fine, but as the API grows you want a single place to manage response formatting, error codes, and headers.

The simplest approach is a `utils.py` file in the `shared/` directory that gets copied into each function directory at build time:

```python
# shared/utils.py
import json

def ok(body: dict, status_code: int = 200) -> dict:
    return _response(status_code, body)

def error(message: str, status_code: int = 400) -> dict:
    return _response(status_code, {"error": message})

def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
```

```bash
# Copy utils.py into each function directory before deploying
cp shared/utils.py lambdas/list_events/utils.py
cp shared/utils.py lambdas/create_event/utils.py
cp shared/utils.py lambdas/get_event/utils.py
cp shared/utils.py lambdas/delete_event/utils.py
```

Then in each handler:

```python
from utils import ok, error

def main(event, context):
    event_id = event["pathParameters"]["id"]
    item = _table.get_item(Key={"pk": f"EVENT#{event_id}"}).get("Item")
    return ok(item) if item else error("Event not found", 404)
```

**Lambda Layers** are the alternative — define the shared code once, attach the layer to all functions, and Lambda makes it available at `/opt/python`. In CDK:

```typescript
const sharedLayer = new lambda.LayerVersion(this, "SharedLayer", {
  code: lambda.Code.fromAsset("shared"),
  compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
  compatibleArchitectures: [lambda.Architecture.ARM_64],
});

const listEvents = new lambda.Function(this, "ListEvents", {
  ...commonProps,
  handler: "handler.main",
  code: lambda.Code.fromAsset("lambdas/list_events"),
  layers: [sharedLayer],
});
```

Layers are the right choice when the shared code is substantial enough that copying it creates a maintenance problem. For a single `utils.py` under 100 lines, copying is simpler. For a shared data access layer, auth middleware, or typed model library, a layer is worth the extra CDK setup.

One thing layers do **not** do is speed up cold starts. Lambda extracts layer ZIPs during container init alongside the function package — adding a layer adds data to extract, not less. The cold start benefit often cited for layers is a side effect of keeping the main deployment package smaller, which you can achieve just as well by only packaging what each function needs.

## Verifying the Result

After deploying, confirm cold start duration by checking CloudWatch Logs. Every cold start invocation emits an `Init Duration` field in the `REPORT` line:

```
REPORT RequestId: abc-123  Duration: 38.42 ms  Billed Duration: 39 ms  Memory Size: 512 MB  Max Memory Used: 71 MB  Init Duration: 148.67 ms
```

A minimal DynamoDB-backed handler on Graviton at 512 MB should cold-start in **100–250ms**. If you're seeing 500ms or more, check:

1. **Package size** — is boto3 bundled unnecessarily? Any transitive dependencies you don't use?
2. **Module-level init** — are you doing any I/O (API calls, file reads) at module level?
3. **Architecture** — is the function on x86 when it could be ARM64?
4. **Memory** — is it set to 128 MB?

For a visual breakdown per invocation, X-Ray traces (enabled by `tracing: lambda.Tracing.ACTIVE`) show `Initialization`, `Invocation`, and `Overhead` segments in the CloudWatch console. [Lambda Cold Starts](/articles/lambda-cold-starts) covers the Logs Insights query and X-Ray setup in detail.

## The Takeaway

- **One Lambda per route** keeps each function's imports and package size scoped to what that route actually needs. A monolith Lambda pays every route's init cost on every cold start.
- **Initialize boto3 clients at module level**, not inside the handler. They're reused across warm invocations at no cost.
- **Don't bundle boto3**. It's already in the Lambda runtime. Bundling it adds ~10 MB to every ZIP for nothing.
- **ARM64 (Graviton) is a free win**. Faster cold starts, 20% cheaper, one line in CDK.
- **512 MB is the right default memory**. More CPU means faster function init. Don't set 128 MB to save money — you often spend more.
- **Skip the web framework**. FastAPI on Lambda adds 500ms–1s to cold start time for a routing layer API Gateway already handles. A plain handler with a `utils.py` response helper is all you need.
- **Shared code via copy or Layer**. For small utilities, copy the file. For a substantial shared library, use a Lambda Layer. Neither approach speeds up cold starts — that comes from package size and init code.

For the full cold start optimization toolkit — measuring with Logs Insights and X-Ray, lazy imports, provisioned concurrency, and when cold starts don't matter — see [Lambda Cold Starts](/articles/lambda-cold-starts). For the foundational HTTP API and DynamoDB wiring this article builds on, see [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda).
