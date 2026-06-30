---
title: Authorizer Lambdas with Cognito and API Gateway
date: 2026-06-29
excerpt: Cognito can tell you who a user is, but it cannot answer what they are allowed to do. An authorizer Lambda gives you one place to evaluate permissions before a request reaches your backend, with Cognito for identity and a separate permission source for authorization.
draft: false
tags: ["aws", "serverless", "cognito", "api-gateway", "authorization"]
---

If you are building an API with Cognito, API Gateway, and Lambda, the first question is not whether you can validate a token. AWS already gives you good tools for that. The real question is where your authorization logic should live.

That is why I like authorizer Lambdas. They give you one place, in front of API Gateway, to decide whether a request should reach your backend at all.

Cognito can tell you who the user is. An authorizer Lambda can decide what that user is allowed to do. That separation keeps your handler functions focused on business logic and gives you a cleaner place to evolve your permission model over time.

## Authentication Is Not Authorization

Cognito is good at authentication. It handles login, token issuance, and identity claims. For many apps, that is enough.

But authentication only answers one question: is this user real?

Authorization answers the more important one: what can they do?

That distinction matters as soon as your rules get beyond "logged in or not." You may need to ask:

- Can this user delete an article?
- Can they access tenant A but not tenant B?
- Can they edit projects, but only ones they own?
- Can an admin do everything while an editor can only write and publish?

Once you need those rules, you need an authorization layer.

## Why Put the Logic in an Authorizer Lambda

I like this pattern for three reasons.

First, it keeps backend Lambdas focused on business logic. Your handler should create the article, save the row, or return the response. It should not need to rediscover the permission model on every request.

Second, it gives you a central policy point. If the permission model changes, you change it once. You do not need to update ten route handlers and hope they stay in sync.

Third, it scales better than scattering checks everywhere. With API Gateway caching authorizer results, you can avoid recomputing the same decision on every request. The authorizer runs once per token per cache window, not every time the user clicks a button.

## Cognito’s Job in the System

In this setup, Cognito is the identity provider, not the policy engine.

Cognito handles:

- login and token issuance
- group membership
- user identity claims
- coarse roles like `admin`, `editor`, or `viewer`

That is enough for broad grouping. It is not enough for fine-grained permissions.

If you try to squeeze every permission into Cognito groups, the model gets awkward fast. Groups are good for broad roles. They are not good for resource-level rules or tenant-specific access.

## What the Authorizer Lambda Does

The authorizer Lambda sits in front of API Gateway and answers one question: should this request be allowed?

A typical flow looks like this:

```text
Client -> API Gateway -> Authorizer Lambda -> Allow / Deny -> Backend Lambda
```

The authorizer usually does four things:

1. Verifies the Cognito JWT.
2. Reads the user ID and groups from the token.
3. Looks up permissions in your authorization source.
4. Returns allow or deny, plus any useful context for the backend.

That lets you keep the actual route handler small. By the time your handler runs, the request is already authenticated and authorized.

## Writing the Custom Authorizer Lambda

This is where the permission model becomes code.

The authorizer Lambda verifies the Cognito token, pulls out the user identity and groups, asks a permission helper whether the request should be allowed, and returns `Allow` or `Deny` to API Gateway.

Here is a simple TypeScript example for a REST API Lambda authorizer:

```typescript
import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.authorizationToken.replace(/^Bearer\s+/i, "");
    const claims = await verifier.verify(token);

    const userId = claims.sub;
    const groups = (claims["cognito:groups"] as string[] | undefined) ?? [];
    const required = requiredPermissionFromMethodArn(event.methodArn);

    const allowed = await hasPermission(
      userId,
      groups,
      required.resource,
      required.action,
    );

    return buildPolicy(userId, allowed ? "Allow" : "Deny", event.methodArn, {
      userId,
      groups: groups.join(","),
    });
  } catch {
    throw new Error("Unauthorized");
  }
};

async function hasPermission(
  userId: string,
  groups: string[],
  resource: string,
  action: string,
): Promise<boolean> {
  void userId;
  void groups;
  void resource;
  void action;

  return true;
}

function buildPolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context: Record<string, string>,
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };
}

function requiredPermissionFromMethodArn(methodArn: string) {
  if (methodArn.includes("/DELETE/")) {
    return { resource: "articles", action: "delete" };
  }

  if (methodArn.includes("/POST/")) {
    return { resource: "articles", action: "write" };
  }

  return { resource: "articles", action: "read" };
}
```

The main thing to notice is the shape of the responsibility boundary:

- Cognito verifies identity.
- Your authorization source stores the permission data.
- The authorizer Lambda decides allow or deny.
- The handler Lambda never has to know how the permission model works.

You can make the lookup smarter over time, but the core pattern stays the same.

## Adding the Authorizer in CDK

Once the authorizer exists, you attach it to the protected routes in API Gateway.

This example uses a REST API, because Lambda authorizers on REST APIs return IAM policies:

```typescript
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

const api = new apigateway.RestApi(this, "ArticlesApi", {
  restApiName: "Articles API",
});

const authorizerFn = new lambda.Function(this, "AuthorizerFn", {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "handler.main",
  code: lambda.Code.fromAsset("lambdas/authorizer"),
  environment: {
    COGNITO_USER_POOL_ID: userPool.userPoolId,
    COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
  },
});

const authorizer = new apigateway.TokenAuthorizer(this, "Authorizer", {
  handler: authorizerFn,
  identitySource: apigateway.IdentitySource.header("Authorization"),
  resultsCacheTtl: cdk.Duration.minutes(5),
});

const articles = api.root.addResource("articles");

articles.addMethod("GET");
articles.addMethod("POST", new apigateway.LambdaIntegration(createArticleFn), {
  authorizer,
  authorizationType: apigateway.AuthorizationType.CUSTOM,
});

articles.addMethod(
  "DELETE",
  new apigateway.LambdaIntegration(deleteArticleFn),
  {
    authorizer,
    authorizationType: apigateway.AuthorizationType.CUSTOM,
  },
);
```

That gives you a clean separation:

- public routes stay open
- protected routes opt into the authorizer
- the authorizer can cache decisions for a few minutes
- your backend Lambdas stay small

## Why This Scales

A custom authorizer is the right move when your authorization logic is more than "valid token, good to go."

It scales because it keeps the decision in one place. You can add tenant checks, per-resource rules, or temporary overrides without rewriting every handler.

It also scales operationally. The authorizer is easy to observe, easy to cache, and easy to change without reworking the whole API.

## When Not to Use This Pattern

Do not reach for a custom authorizer Lambda if:

- Cognito JWT validation is all you need
- your permission model is tiny and static
- you are not using API Gateway
- you want the lowest possible latency and no custom logic

If your needs are simple, API Gateway’s built-in JWT authorizer may be enough. Use the Lambda authorizer when you need permission logic that goes beyond "token valid or not."

## The Short Version

Use Cognito for identity. Use groups for coarse roles. Use a separate permission source for fine-grained access rules. Use an authorizer Lambda to evaluate the combination before the request reaches your backend.

That gives you a clean separation:

- Cognito answers who the user is
- your authorization source answers what they can do
- API Gateway enforces the decision
- your backend stays focused on business logic
