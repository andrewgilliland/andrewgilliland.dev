---
title: Securing a Lambda API with Lambda Authorizers
date: 2026-05-10
excerpt: The Events API is built and fast. Now POST /events and DELETE /events/{id} need auth. Lambda authorizers let you validate any token format from any issuer before a request ever reaches your handler.
draft: false
tags: ["aws", "serverless", "python", "cdk"]
---

[Structuring a Lambda API for Performance](/articles/structuring-a-lambda-api-for-performance) builds an Events API - four routes, four Lambda functions, DynamoDB, ARM64, CDK. The API is fast. It's also completely open. Any request to `POST /events` or `DELETE /events/{id}` goes straight through to the handler.

This article adds auth to that stack using a Lambda authorizer.

## Why Not the Built-In Options

API Gateway HTTP APIs have two built-in auth mechanisms:

**JWT authorizer** - validates tokens from a specific OIDC/OAuth2 issuer using the issuer's public JWKS endpoint. Works out of the box with Cognito, Auth0, Okta. Zero code required; configure the issuer URL and audience in CDK and API Gateway handles validation.

**IAM authorization** - requires requests to be signed with AWS Signature Version 4. Works well for service-to-service calls within AWS. Not practical for client-facing APIs.

If your tokens come from Cognito, Auth0, or any standard OIDC provider, use the built-in JWT authorizer - it's faster and requires no code. Lambda authorizers are for everything else:

- Tokens from a legacy or internal auth system with custom claims
- API keys that map to tiers, quotas, or permissions stored in DynamoDB
- HMAC signatures on request bodies
- Multi-tenant scenarios where token validation logic differs by tenant
- Any situation where "does this token allow this action" requires business logic

## How It Works

```
Client → API Gateway → Authorizer Lambda → [allow / deny] → Handler Lambda
```

When a request arrives at a route with a Lambda authorizer attached, API Gateway invokes the authorizer Lambda first - before the handler Lambda runs. The authorizer reads the token, validates it, and returns a response that tells API Gateway whether to proceed.

If the authorizer returns `isAuthorized: true`, API Gateway forwards the request to the handler. If it returns `isAuthorized: false`, API Gateway returns a 403 to the client and the handler is never invoked.

The authorizer result is **cached**. After the first invocation for a given token, API Gateway reuses the cached result for subsequent requests with the same token until the TTL expires. The authorizer Lambda doesn't run on every request - just once per token per cache window.

## Simple vs. IAM Response Format

For REST APIs (v1), Lambda authorizers must return an IAM policy document - an `Allow` or `Deny` effect on an ARN. That's verbose.

HTTP APIs (v2) support a simpler format: just return a JSON object with an `isAuthorized` boolean. No policy document, no ARN construction. Since the Events API uses an HTTP API (`HttpApi` in CDK), use the simple format.

```python
# Simple response - HTTP API only
{"isAuthorized": True, "context": {"userId": "usr_abc123"}}

# IAM policy response - required for REST API (v1)
{
    "principalId": "usr_abc123",
    "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Action": "execute-api:Invoke", "Resource": "arn:aws:..."}]
    }
}
```

## The Authorizer Handler

Add the authorizer as a new Lambda function in the project:

```
events-api/
├── lambdas/
│   ├── authorizer/
│   │   ├── handler.py
│   │   └── requirements.txt   # PyJWT only
│   ├── list_events/
│   ├── create_event/
│   ├── get_event/
│   └── delete_event/
```

```python
# lambdas/authorizer/handler.py
import os
import jwt  # PyJWT

_SECRET = os.environ["JWT_SECRET"]

def main(event, context):
    # identitySource is the value of the Authorization header
    auth_header = event.get("identitySource", "")
    token = auth_header.removeprefix("Bearer ").strip()

    if not token:
        return {"isAuthorized": False}

    try:
        payload = jwt.decode(token, _SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return {"isAuthorized": False}

    return {
        "isAuthorized": True,
        "context": {
            "userId": payload["sub"],
        },
    }
```

A few things to notice:

**`_SECRET` is read at module level.** Same pattern as the handler functions in the structuring article - anything that doesn't change between invocations belongs at module level. The secret is read from the environment once per execution environment, not once per request.

**The authorizer never raises exceptions.** A Python exception propagates to API Gateway as a 500, not a 403. Always return `isAuthorized: False` for invalid tokens. Only raise if there's a genuine infrastructure failure you want to surface.

**`removeprefix` instead of `split`.** Tokens typically arrive as `Bearer <token>`. Splitting on space is fragile if the header value has leading whitespace or an unexpected format. `removeprefix` handles the common case cleanly.

The dependencies file for the authorizer is minimal:

```
# lambdas/authorizer/requirements.txt
PyJWT==2.9.0
```

That's it. PyJWT is ~50 KB. The authorizer cold-starts fast, which matters - the authorizer runs before every non-cached request across all protected routes.

## Storing the Secret

The JWT secret goes in SSM Parameter Store as a SecureString - not hardcoded in CDK, not in a `.env` file committed to the repo.

Store it once:

```bash
aws ssm put-parameter \
  --name "/events-api/jwt-secret" \
  --value "your-secret-here" \
  --type SecureString
```

CDK reads it at deploy time and injects it as an environment variable:

```typescript
import * as ssm from "aws-cdk-lib/aws-ssm";

const jwtSecret = ssm.StringParameter.valueForStringParameter(
  this,
  "/events-api/jwt-secret",
);
```

Pass it into the authorizer function's environment:

```typescript
environment: {
  JWT_SECRET: jwtSecret,
},
```

Lambda decrypts the SecureString automatically using the KMS key associated with the parameter. The plaintext value is available as `os.environ["JWT_SECRET"]` in the handler.

## CDK Wiring

Install the authorizers package if it's not already in your CDK project:

```bash
npm install aws-cdk-lib  # HttpLambdaAuthorizer is in aws-cdk-lib/aws-apigatewayv2-authorizers
```

Add the authorizer function and attach it to the write routes in `lib/api-stack.ts`:

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType,
} from "aws-cdk-lib/aws-apigatewayv2-authorizers";

// Inside the ApiStack constructor, after commonProps is defined:

const jwtSecret = ssm.StringParameter.valueForStringParameter(
  this,
  "/events-api/jwt-secret",
);

const authorizerFn = new lambda.Function(this, "AuthorizerFn", {
  ...commonProps,
  functionName: "events-api-authorizer",
  code: lambda.Code.fromAsset("lambdas/authorizer"),
  handler: "handler.main",
  environment: {
    JWT_SECRET: jwtSecret,
  },
});

const authorizer = new HttpLambdaAuthorizer("LambdaAuthorizer", authorizerFn, {
  responseTypes: [HttpLambdaResponseType.SIMPLE],
  identitySource: ["$request.header.Authorization"],
  resultsCacheTtl: cdk.Duration.minutes(5),
});
```

Apply the authorizer only to the write routes. `GET` routes stay public:

```typescript
// Public - no authorizer
api.addRoutes({
  path: "/events",
  methods: [apigatewayv2.HttpMethod.GET],
  integration: new integrations.HttpLambdaIntegration(
    "ListEventsInt",
    listEvents,
  ),
});

api.addRoutes({
  path: "/events/{id}",
  methods: [apigatewayv2.HttpMethod.GET],
  integration: new integrations.HttpLambdaIntegration("GetEventInt", getEvent),
});

// Protected - authorizer required
api.addRoutes({
  path: "/events",
  methods: [apigatewayv2.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration(
    "CreateEventInt",
    createEvent,
  ),
  authorizer,
});

api.addRoutes({
  path: "/events/{id}",
  methods: [apigatewayv2.HttpMethod.DELETE],
  integration: new integrations.HttpLambdaIntegration(
    "DeleteEventInt",
    deleteEvent,
  ),
  authorizer,
});
```

`identitySource: ["$request.header.Authorization"]` tells API Gateway which part of the request to extract as the token and pass to the authorizer. If the header is missing, API Gateway returns 401 before invoking the authorizer at all.

## Accessing Identity in the Handler

The `context` object returned by the authorizer flows through to the handler Lambda automatically. It's available at `event["requestContext"]["authorizer"]["lambda"]`:

```python
# lambdas/create_event/handler.py
def main(event, context):
    auth_context = event["requestContext"]["authorizer"]["lambda"]
    user_id = auth_context["userId"]

    body = json.loads(event.get("body") or "{}")
    name = body.get("name")
    if not name:
        return _response(400, {"error": "name is required"})

    event_id = str(uuid.uuid4())
    item = {
        "pk": f"EVENT#{event_id}",
        "id": event_id,
        "name": name,
        "createdBy": user_id,  # populated from the authorizer context
    }

    _table.put_item(Item=item)
    return _response(201, item)
```

The handler doesn't re-validate the token. Token validation is the authorizer's job - by the time `main()` runs, the request has already been authorized. The `context` object is just structured data passed through from the authorizer's return value.

## Cache TTL Tradeoffs

The `resultsCacheTtl` setting controls how long API Gateway reuses a cached authorizer result for a given token:

| TTL                    | Use case                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `Duration.seconds(0)`  | Development - authorizer runs on every request, easy to debug |
| `Duration.minutes(5)`  | Default - good for most production use cases                  |
| `Duration.minutes(30)` | Long-lived API keys that change infrequently                  |

The tradeoff is revocation latency. If you revoke a token (or deactivate an API key), requests using that token continue to succeed until the cached result expires. For short-lived JWTs - tokens that expire in 15–60 minutes anyway - a 5-minute cache window is fine. For API keys with no built-in expiry, a shorter TTL gives you tighter revocation control at the cost of more authorizer invocations.

Set TTL to `Duration.seconds(0)` during development. It's much easier to debug auth logic when you can see every authorizer invocation in CloudWatch rather than hunting for why a code change isn't taking effect.

## Verifying It Works

After deploying, test with `curl`. Replace `$API_URL` with the `ApiUrl` output from CDK:

```bash
# Missing token - API Gateway returns 401 before invoking the authorizer
curl -X POST $API_URL/events \
  -H "Content-Type: application/json" \
  -d '{"name": "AWS re:Invent"}'
# → 401 Unauthorized

# Invalid token - authorizer returns isAuthorized: false, API Gateway returns 403
curl -X POST $API_URL/events \
  -H "Authorization: Bearer bad-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "AWS re:Invent"}'
# → 403 Forbidden

# Valid token - request reaches the handler
curl -X POST $API_URL/events \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "AWS re:Invent"}'
# → 201 Created

# Public route - no token required
curl $API_URL/events
# → 200 OK
```

In CloudWatch Logs, the authorizer function and the handler functions log separately under their own log groups. On a cache hit, only the handler log group gets a new entry - the authorizer log group won't. On a cold-start authorizer invocation you'll see `Init Duration` in the authorizer's `REPORT` line, same as any other Lambda function.

## The Takeaway

- **Use the built-in JWT authorizer** for Cognito, Auth0, Okta, or any standard OIDC provider. Lambda authorizers are for custom logic.
- **Keep the authorizer handler lean.** It runs before every non-cached request across all protected routes. Its cold start matters more than the handler's.
- **Read the secret at module level**, not inside the handler. Same pattern as the DynamoDB client in the handler functions.
- **Use SSM Parameter Store SecureString** for the JWT secret. Not environment variable literals, not `.env` files.
- **Apply auth selectively.** Read routes that don't need protection should stay public - don't add unnecessary latency to unauthenticated endpoints.
- **Set TTL to 0 during development.** Cached results hide auth logic changes. Turn caching on when you're satisfied the logic is correct.
- **The authorizer context is the right place for identity.** Return `userId` (or whatever identity data the handler needs) from the authorizer context rather than decoding the token again in the handler.

For the API structure this article builds on, see [Structuring a Lambda API for Performance](/articles/structuring-a-lambda-api-for-performance). For the foundational HTTP API and DynamoDB wiring, see [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda).
