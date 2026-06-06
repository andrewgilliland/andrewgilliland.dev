---
title: Hosting TanStack Start on AWS
date: 2026-06-04
excerpt: How to deploy a TanStack Start SSR app to AWS using Lambda or ECS Fargate, wired together with CloudFront, S3, and CDK.
draft: false
tags: ["aws", "cdk", "typescript", "tanstack", "serverless", "react"]
---

TanStack Start is a full-stack framework built on TanStack Router and Vite. Unlike a pure client-side SPA, a TanStack Start app has a server component - it handles server-side rendering, API routes, and server functions. That changes how you deploy it. You can't just drop the build output in an S3 bucket and call it done. You need compute that stays running (or spins up on demand) to handle requests.

This article covers everything you need to host a TanStack Start app on AWS: the build output model, the AWS services involved, the architecture that ties them together, and a full CDK stack that provisions the whole thing.

## What TanStack Start Needs to Run

When you run `npm run build` on a TanStack Start project, you get two things:

1. **A server bundle** - a Node.js-compatible handler that renders pages on the server, serves API routes, and runs server functions.
2. **A client bundle** - static files (JS, CSS, images) that the browser loads after the initial HTML is delivered.

TanStack Start uses an **adapter model** to target different deployment environments. The two most relevant for AWS are:

- **`aws-lambda` adapter** - packages the server as a Lambda-compatible handler function. Exports a `handler(event, context)` function that AWS Lambda knows how to invoke.
- **`node` adapter** - packages the server as a standalone Node.js HTTP server. Used when running inside a container (e.g., ECS Fargate).

The client bundle is just static files. Once built, those can be served from S3 and cached aggressively by CloudFront. The server bundle needs actual compute to execute on every request.

The adapter is configured in `vite.config.ts` via the Nitro plugin. A common pattern is to switch presets based on the environment:

```typescript
// vite.config.ts
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    nitro({
      preset:
        process.env.NODE_ENV === "production" ? "aws-lambda" : "node-server",
    }),
    // ... other plugins
  ],
});
```

This means local dev runs a plain Node.js HTTP server (no Lambda emulation overhead), and production builds target the AWS Lambda handler format.

This split - static assets on S3, dynamic rendering on compute - is the core pattern this article is built around.

## The AWS Architecture

The architecture routes all traffic through a single CloudFront distribution. CloudFront decides where to send each request based on the URL path:

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│          Route 53 (DNS)             │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│        CloudFront Distribution      │
│                                     │
│  Cache Behavior: /assets/*  ──────► S3 Bucket (static assets)
│  Default Behavior: /*       ──────► Lambda Function URL (SSR)
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│   S3 Bucket     │  │  Lambda (SSR)   │
│  (private, OAC) │  │  nodejs22.x     │
└─────────────────┘  └─────────────────┘
```

The key decisions baked into this architecture:

- **CloudFront is the only public entry point.** S3 is private and only accessible via Origin Access Control (OAC). Lambda is invoked via its Function URL, which CloudFront calls directly.
- **Two cache behaviors.** `/assets/*` paths are long-cached static files. Everything else hits Lambda for SSR.
- **Lambda Function URL instead of API Gateway.** For SSR workloads you don't need routing, validation, or usage plans - just an HTTPS endpoint to invoke Lambda. Function URLs are free (you only pay for Lambda invocations) and simpler to configure.

## AWS Services Breakdown

### CloudFront

CloudFront is the CDN and unified entry point. It sits in front of both S3 and Lambda, terminates SSL, and applies cache behaviors to decide where each request goes.

Two behaviors are configured on the distribution:

| Behavior      | Path Pattern | Origin              | Cache TTL                                         |
| ------------- | ------------ | ------------------- | ------------------------------------------------- |
| Static assets | `/assets/*`  | S3 bucket           | Long (e.g., 1 year with content hash in filename) |
| SSR (default) | `/*`         | Lambda Function URL | Short or no-cache                                 |

CloudFront also handles custom domains. You point your Route 53 alias record at the CloudFront distribution, attach an ACM certificate, and CloudFront handles HTTPS termination.

### S3

S3 stores the client bundle - the JS, CSS, and any static assets from your `public/` directory. The bucket is **private**: no public access, no public bucket policy. CloudFront accesses it using an **Origin Access Control (OAC)** resource that signs requests with SigV4.

> **Note:** OAC is the current recommended approach. The older Origin Access Identity (OAI) is still functional but AWS recommends migrating to OAC for new distributions.

### Lambda + Lambda Function URL

Lambda runs the server bundle built with the `aws-lambda` adapter. Each incoming request from CloudFront triggers a Lambda invocation, which renders the page, executes server functions, or handles API routes.

**Lambda Function URLs** provide a direct HTTPS endpoint to invoke a Lambda function without going through API Gateway. For an SSR use case, this is the right choice - you're not doing request routing, schema validation, or usage plans. Function URLs are free and reduce the number of services you need to manage.

The function runs on `nodejs22.x` and needs enough memory to handle React SSR comfortably. 1024MB is a good starting point - SSR involves parsing and rendering a full React tree on every request, and giving Lambda enough headroom reduces both latency and the chance of OOM errors. Tune down after profiling if cost is a concern.

> **API Gateway vs Function URL:** This article uses Lambda Function URLs for simplicity - no extra service, no per-request API Gateway cost. If you need request validation, usage plans, or API keys, swap the Function URL for an API Gateway HTTP API pointing at the same Lambda function. The CloudFront origin configuration changes to point at the API Gateway endpoint instead.

### ECS Fargate

If you use the `node` adapter and package your app as a Docker container, ECS Fargate is the alternative compute option. Instead of a Lambda Function URL, CloudFront's default behavior points to an Application Load Balancer in front of a Fargate service.

See the [Lambda vs ECS Fargate](#lambda-vs-ecs-fargate-choosing-your-compute) section below for when to choose one over the other.

### Route 53 + ACM

Route 53 hosts your domain's DNS. You create an A record alias pointing to the CloudFront distribution's domain name. The ACM certificate must be provisioned in **`us-east-1`** regardless of where the rest of your stack lives - CloudFront requires it.

## Lambda vs ECS Fargate: Choosing Your Compute

|                 | Lambda                                                                        | ECS Fargate                                                           |
| --------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Cold starts** | Yes - can be 200ms–2s on first invoke; mitigated with Provisioned Concurrency | No - container stays running                                          |
| **Cost model**  | Pay per request + duration; very cheap at low/intermittent traffic            | Pay per vCPU/memory hour; predictable at steady traffic               |
| **Scaling**     | Scales to thousands of concurrent requests automatically                      | Scales via ECS Service Auto Scaling; a bit more lag                   |
| **Max timeout** | 15 minutes per invocation                                                     | No timeout limit                                                      |
| **Complexity**  | Low - no cluster, no task definitions, no load balancer                       | Higher - ALB, ECS cluster, task definition, ECR repo                  |
| **Best for**    | Intermittent or bursty traffic; simpler ops; getting started                  | High-sustained traffic; cold starts are unacceptable; need WebSockets |

For most TanStack Start apps, **Lambda is the right default**. It's simpler to set up, cheaper for moderate traffic, and CDK can express it in under 100 lines. Move to Fargate if you're running sustained high concurrency, need WebSocket support, or cold starts are causing user-facing problems that Provisioned Concurrency doesn't solve.

## Implementing with AWS CDK

The full stack is one CDK construct. Here's the project layout:

```
infra/
├── bin/
│   └── infra.ts
├── lib/
│   └── tanstack-start-stack.ts
├── cdk.json
└── package.json
```

### Dependencies

```bash
npm install aws-cdk-lib constructs
```

### The Stack

```typescript
// infra/lib/tanstack-start-stack.ts
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

interface TanStackStartStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
  hostedZoneName: string;
}

export class TanStackStartStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TanStackStartStackProps) {
    super(scope, id, props);

    const { domainName, hostedZoneId, hostedZoneName } = props;

    // ── S3: static assets ────────────────────────────────────────────────────

    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ── Lambda: SSR handler ───────────────────────────────────────────────────

    const ssrFunction = new lambda.Function(this, "SsrFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      // Built with the aws-lambda adapter; output goes to .output/server/
      code: lambda.Code.fromAsset("../.output/server"),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: "production",
      },
    });

    const ssrFunctionUrl = ssrFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // ── CloudFront: OAC + Distribution ────────────────────────────────────────

    const oac = new cloudfront.S3OriginAccessControl(this, "OAC", {
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(
      assetsBucket,
      { originAccessControl: oac },
    );

    // Strip the https:// from the Function URL to use as a custom origin
    const lambdaOriginDomain = cdk.Fn.select(
      2,
      cdk.Fn.split("/", ssrFunctionUrl.url),
    );

    const lambdaOrigin = new origins.HttpOrigin(lambdaOriginDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });

    // ACM certificate must be in us-east-1 for CloudFront
    const certificate = new acm.Certificate(this, "Certificate", {
      domainName,
      validation: acm.CertificateValidation.fromDns(),
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: lambdaOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        // Static JS/CSS bundles
        "/assets/*": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        // Nitro build chunks
        "/_build/*": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        // Images and other static files
        "/favicon.*": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        "/*.jpg": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        "/*.png": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        "/*.svg": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
      },
      domainNames: [domainName],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // ── S3 Deployment: upload static assets ──────────────────────────────────

    new s3deploy.BucketDeployment(this, "DeployAssets", {
      sources: [s3deploy.Source.asset("../.output/public")],
      destinationBucket: assetsBucket,
      distribution,
      distributionPaths: ["/assets/*"],
    });

    // ── Route 53: alias record ────────────────────────────────────────────────

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      { hostedZoneId, zoneName: hostedZoneName },
    );

    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
    });

    // ── Outputs ───────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, "DistributionDomain", {
      value: distribution.domainName,
    });
    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });
  }
}
```

### Entry Point

```typescript
// infra/bin/infra.ts
import * as cdk from "aws-cdk-lib";
import { TanStackStartStack } from "../lib/tanstack-start-stack";

const app = new cdk.App();

new TanStackStartStack(app, "TanStackStartStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName: "app.example.com",
  hostedZoneId: "Z1234567890ABC",
  hostedZoneName: "example.com",
  crossRegionReferences: true,
});
```

> **Note:** ACM certificates for CloudFront must be provisioned in `us-east-1`. If your stack deploys to a different region, set `crossRegionReferences: true` on your stack and ensure your CDK app's `env` allows cross-region reference resolution. Alternatively, split the certificate into a separate stack explicitly in `us-east-1`.

### A Note on Build Output Paths

The CDK stack assumes TanStack Start's build output lands in `.output/` at the repo root (the default for the Nitro-based output):

```
.output/
├── server/    # Lambda handler (index.handler)
│   └── index.mjs
└── public/    # Static assets (uploaded to S3)
    └── assets/
        └── ...
```

Verify your actual adapter output structure and adjust the `code` path and `Source.asset` path accordingly before deploying.

## CI/CD with GitHub Actions

The workflow builds the app, deploys the CDK stack, and invalidates the CloudFront cache for the SSR routes. It uses OIDC for keyless AWS authentication - if you haven't set that up yet, see [Continuous Deployment to AWS with GitHub Actions and OIDC](/articles/continuous-deployment-to-aws-with-github-actions-and-oidc) first.

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install app dependencies
        run: npm ci

      - name: Build TanStack Start app
        run: npm run build

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1

      - name: Install CDK dependencies
        working-directory: infra
        run: npm ci

      - name: CDK deploy
        working-directory: infra
        run: npx cdk deploy --require-approval never
        env:
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-east-1

      - name: Invalidate CloudFront cache (SSR routes)
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

A few things worth calling out in this workflow:

- **Build before deploy.** The CDK stack's `lambda.Code.fromAsset()` and `s3deploy.Source.asset()` calls reference the `.output/` directory, which only exists after `npm run build`. The order matters.
- **Cache invalidation.** The `BucketDeployment` construct handles invalidating `/assets/*` automatically when it uploads new files. The `aws cloudfront create-invalidation` step is for the SSR default behavior - clearing any cached HTML from CloudFront edge nodes.
- **`CLOUDFRONT_DISTRIBUTION_ID`** - add this as a GitHub Actions secret. You can pull it from the CDK output after the first deploy (`DistributionId` output) or look it up in the AWS Console.

## Performance & Cost Considerations

### Lambda Cold Starts

Lambda cold starts on Node.js typically add 200ms–1s to a request. For an SSR app, this lands directly on the user's time-to-first-byte for the first request after a quiet period.

Two mitigations:

- **Provisioned Concurrency** - keeps a pool of warm Lambda instances ready. Add it to the CDK stack:

```typescript
const alias = new lambda.Alias(this, "SsrAlias", {
  aliasName: "live",
  version: ssrFunction.currentVersion,
  provisionedConcurrentExecutions: 2,
});
```

Then point your Function URL at the alias instead of the function directly. Two provisioned instances handles moderate traffic without noticeable cold starts.

- **CloudFront origin keepalive** - CloudFront reuses connections to Lambda Function URLs by default, which helps warm instances stay active between requests.

### CloudFront Caching Strategy

| Route              | Cache TTL            | Rationale                                          |
| ------------------ | -------------------- | -------------------------------------------------- |
| `/assets/*`        | 31,536,000s (1 year) | Content-hashed filenames; safe to cache forever    |
| `/*` (SSR default) | 0 (no-cache)         | Pages may include user-specific or dynamic content |

If some of your SSR routes are truly static in practice (e.g., a public marketing page that rarely changes), you can add a separate cache behavior with a short TTL (e.g., 60s) for those paths and reduce Lambda invocations significantly.

### Lambda vs Fargate Cost at Scale

Lambda pricing is pay-per-request plus duration. Fargate pricing is pay-per-hour for reserved vCPU and memory. The crossover point where Fargate becomes cheaper depends on your p50 request duration and concurrency:

| Monthly requests | Lambda estimate | Fargate estimate (0.25 vCPU / 0.5GB) |
| ---------------- | --------------- | ------------------------------------ |
| 1M               | ~$2             | ~$7                                  |
| 10M              | ~$15            | ~$7                                  |
| 100M             | ~$120           | ~$15–30 (with autoscaling)           |

At low-to-moderate traffic, Lambda is almost always cheaper. At high sustained concurrency (thousands of requests per minute around the clock), Fargate wins on cost and consistency.

### Streaming SSR

TanStack Start supports streaming SSR (sending HTML in chunks as React renders). Lambda Function URLs support response streaming via `lambda.FunctionUrlInvokeMode.RESPONSE_STREAM`. CloudFront passes streaming responses through to the browser when the `Transfer-Encoding: chunked` header is present.

To enable streaming in CDK:

```typescript
const ssrFunctionUrl = ssrFunction.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
});
```

Check TanStack Start's Lambda adapter docs for whether streaming is supported and what adapter configuration is required on the application side.
