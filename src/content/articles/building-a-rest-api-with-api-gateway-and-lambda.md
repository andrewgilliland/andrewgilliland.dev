---
title: Building a REST API with API Gateway and Lambda
date: 2026-04-07
excerpt: Wire up API Gateway to Lambda functions and build a serverless REST API using Python and CDK.
draft: false
---

## What We're Building

A serverless REST API for a simple `events` resource. Four routes, four Lambda functions, one API Gateway HTTP API - all defined in CDK.

| Method   | Path           | What It Does      |
| -------- | -------------- | ----------------- |
| `GET`    | `/events`      | Return all events |
| `POST`   | `/events`      | Create an event   |
| `GET`    | `/events/{id}` | Get one event     |
| `DELETE` | `/events/{id}` | Delete an event   |

API Gateway handles routing, CORS, and throttling. Lambda handles the business logic. DynamoDB stores the data. CDK defines all of it as code.

Here's the project structure:

```
my-api/
├── lambdas/              # Python Lambda handlers
│   ├── list_events.py
│   ├── create_event.py
│   ├── get_event.py
│   ├── delete_event.py
│   └── utils.py          # shared response helper
├── lib/                  # CDK stack
│   └── api-stack.ts
├── bin/
│   └── my-api.ts
├── cdk.json
└── package.json
```

## API Gateway Basics

API Gateway is the front door of a serverless API. A request comes in, API Gateway routes it to the right Lambda function, Lambda runs and returns a response, and API Gateway sends that response back to the caller. You don't manage servers or load balancers - it scales automatically.

**REST API vs HTTP API**

API Gateway offers two flavors and the naming is confusing:

|                              | HTTP API        | REST API          |
| ---------------------------- | --------------- | ----------------- |
| **Cost**                     | ~70% cheaper    | More expensive    |
| **Latency**                  | Lower           | Higher            |
| **CORS**                     | Built-in config | Manual setup      |
| **Request validation**       | No              | Yes               |
| **Usage plans and API keys** | No              | Yes               |
| **Response caching**         | No              | Yes               |
| **When to use**              | Most new APIs   | Advanced features |

For most new APIs - including this one - use HTTP API. It's cheaper, faster, and simpler to configure. Reach for REST API when you need request validation, usage plans, or response caching.

## Designing the API Routes

Before writing any code, map out your routes. Every route needs a method, a path, and a handler.

| Method   | Path           | Handler File      | Description                               |
| -------- | -------------- | ----------------- | ----------------------------------------- |
| `GET`    | `/events`      | `list_events.py`  | Scan and return all events                |
| `POST`   | `/events`      | `create_event.py` | Parse body, write to DynamoDB, return 201 |
| `GET`    | `/events/{id}` | `get_event.py`    | Look up by ID, return 200 or 404          |
| `DELETE` | `/events/{id}` | `delete_event.py` | Remove by ID, return 204                  |

**One Lambda per route vs. one monolithic Lambda**

You can wire all routes to a single Lambda that handles routing internally - simpler to start with, and useful when porting an existing Flask or FastAPI app. The one-Lambda-per-route approach keeps functions small and focused, lets you configure different memory and timeout settings per route, and gives each function its own IAM policy. That's the pattern we're using here.

## Writing the Lambda Handlers

API Gateway sends each request to Lambda as an event object. For HTTP API, the key fields are:

- `event["pathParameters"]["id"]` - path parameters like `{id}`
- `event["body"]` - the raw request body as a string (JSON-decode it yourself)
- `event["requestContext"]["http"]["method"]` - the HTTP method

The response Lambda returns must include `statusCode`, `body` (a JSON-encoded string, not a dict), and `headers`.

Each handler reads the DynamoDB table name from an environment variable set by CDK.

```python
# lambdas/list_events.py
import json
import os
import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    result = table.scan()
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(result["Items"]),
    }
```

```python
# lambdas/create_event.py
import json
import os
import uuid
import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Invalid JSON in request body"}),
        }

    record = {"id": str(uuid.uuid4()), **body}
    table.put_item(Item=record)

    return {
        "statusCode": 201,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(record),
    }
```

```python
# lambdas/get_event.py
import json
import os
import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    event_id = event["pathParameters"]["id"]
    result = table.get_item(Key={"id": event_id})
    record = result.get("Item")

    if not record:
        return {
            "statusCode": 404,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Event not found"}),
        }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(record),
    }
```

```python
# lambdas/delete_event.py
import json
import os
import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    event_id = event["pathParameters"]["id"]
    result = table.get_item(Key={"id": event_id})

    if not result.get("Item"):
        return {
            "statusCode": 404,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Event not found"}),
        }

    table.delete_item(Key={"id": event_id})

    return {
        "statusCode": 204,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": "",
    }
```

We're using DynamoDB to store events. For a deeper look at how it works, see [Intro to DynamoDB for Python Developers](/articles/intro-to-dynamodb-for-python-developers).

## CDK: Creating the API and Wiring Up Routes

In CDK, you create the Lambda functions first, then build the HTTP API, then add routes that connect each path and method to a Lambda integration. The route definitions and integrations happen together - there's no clean way to split them.

```typescript
// lib/api-stack.ts
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "EventsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Helper: create a Lambda and grant it table access
    const makeHandler = (id: string, handlerFile: string) => {
      const fn = new lambda.Function(this, id, {
        runtime: lambda.Runtime.PYTHON_3_13,
        handler: `${handlerFile}.handler`,
        code: lambda.Code.fromAsset("lambdas"),
        environment: { TABLE_NAME: table.tableName },
      });
      table.grantReadWriteData(fn);
      return fn;
    };

    const listEvents = makeHandler("ListEvents", "list_events");
    const createEvent = makeHandler("CreateEvent", "create_event");
    const getEvent = makeHandler("GetEvent", "get_event");
    const deleteEvent = makeHandler("DeleteEvent", "delete_event");

    const api = new apigwv2.HttpApi(this, "EventsApi", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    api.addRoutes({
      path: "/events",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("ListEvents", listEvents),
    });
    api.addRoutes({
      path: "/events",
      methods: [apigwv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration("CreateEvent", createEvent),
    });
    api.addRoutes({
      path: "/events/{id}",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetEvent", getEvent),
    });
    api.addRoutes({
      path: "/events/{id}",
      methods: [apigwv2.HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("DeleteEvent", deleteEvent),
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url! });
  }
}
```

The `makeHandler` helper keeps things DRY - each function gets the same runtime, code bundle, environment variable, and table permissions with just an ID and handler filename.

Deploy it:

```bash
cdk deploy
```

Copy the `ApiUrl` from the stack output. You'll need it for testing.

## Handling CORS

CORS requires changes in two places. Get only one right and the browser still blocks the request.

**1. API Gateway - handles the OPTIONS preflight**

When a browser makes a cross-origin request, it first sends an OPTIONS preflight to ask if the API allows it. The `corsPreflight` config on the CDK `HttpApi` construct handles this automatically - API Gateway responds to OPTIONS without invoking Lambda.

**2. Lambda - handles the actual response**

The preflight tells the browser the API allows cross-origin requests. But the actual `GET`, `POST`, or `DELETE` response also needs `Access-Control-Allow-Origin` in its headers. That's the `"Access-Control-Allow-Origin": "*"` in every handler's `headers` dict.

Miss the Lambda header and the preflight succeeds, the request fires - and then the browser blocks the response anyway. Both are required.

## Testing with curl

Grab the API URL from the CDK output and test each route. Replace `$API_URL` with your actual URL:

```bash
# Create an event
curl -X POST $API_URL/events \
  -H "Content-Type: application/json" \
  -d '{"name": "CDK Workshop", "date": "2026-06-15"}'
# {"id": "550e8400-e29b-41d4-a716-446655440000", "name": "CDK Workshop", "date": "2026-06-15"}

# List all events
curl $API_URL/events
# [{"id": "550e8400-e29b-41d4-a716-446655440000", "name": "CDK Workshop", "date": "2026-06-15"}]

# Get one event
curl $API_URL/events/550e8400-e29b-41d4-a716-446655440000
# {"id": "550e8400-e29b-41d4-a716-446655440000", "name": "CDK Workshop", "date": "2026-06-15"}

# Delete it
curl -X DELETE $API_URL/events/550e8400-e29b-41d4-a716-446655440000
# (204 No Content)

# Try to get it again
curl $API_URL/events/550e8400-e29b-41d4-a716-446655440000
# {"error": "Event not found"}
```

## Adding Error Handling

The handlers above repeat the same response shape in every return statement. A shared helper cleans that up:

```python
# lambdas/utils.py
import json

def response(status_code: int, body: dict | list | str = "") -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }
```

Because all handlers share the same `lambdas/` code bundle, any file in that directory is importable. Refactoring `get_event.py` with the helper:

```python
# lambdas/get_event.py (refactored)
import os
import boto3
from utils import response

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    event_id = event["pathParameters"]["id"]
    result = table.get_item(Key={"id": event_id})
    record = result.get("Item")

    if not record:
        return response(404, {"error": "Event not found"})

    return response(200, record)
```

And `create_event.py` with field validation added:

```python
# lambdas/create_event.py (refactored)
import json
import os
import uuid
import boto3
from utils import response

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON in request body"})

    if "name" not in body:
        return response(400, {"error": "Missing required field: name"})

    record = {"id": str(uuid.uuid4()), **body}
    table.put_item(Item=record)
    return response(201, record)
```

Apply the same pattern to `list_events.py` and `delete_event.py` and every handler becomes a few lines of actual logic.

## The Takeaway

- **Use HTTP API, not REST API**, for most new projects. It's ~70% cheaper, lower latency, and has built-in CORS configuration. Only reach for REST API when you specifically need request validation, usage plans, or response caching.
- **One Lambda per route** keeps functions focused and independently deployable. Each gets its own memory, timeout, and IAM policy. The `makeHandler` helper pattern keeps the CDK code from becoming repetitive.
- **CORS requires both CDK config and Lambda headers.** `corsPreflight` on the `HttpApi` handles OPTIONS preflights. `Access-Control-Allow-Origin` in the Lambda response headers handles the actual request. Miss either one and the browser blocks it.
- **`pathParameters` and `body` require explicit parsing.** Path parameters come in as strings. The request body arrives as a raw JSON string - call `json.loads()` and wrap it in a `try/except` for malformed input.
- **Lambda responses must be shaped correctly.** `statusCode` is an integer. `body` must be a JSON-encoded string, not a dict. Return the wrong shape and API Gateway silently returns a 502.
- **`table.grantReadWriteData(fn)` is the right IAM pattern in CDK.** It scopes the Lambda's permissions to exactly that table. Avoid attaching broad managed policies to Lambda execution roles.
