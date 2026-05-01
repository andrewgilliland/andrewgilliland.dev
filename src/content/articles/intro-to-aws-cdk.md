---
title: Intro to AWS CDK
date: 2026-04-13
excerpt: AWS CDK lets you define cloud infrastructure with real code instead of YAML. Here's how to get started with TypeScript.
draft: false
tags: ["aws", "cdk", "typescript"]
---

## What Is the CDK?

The AWS Cloud Development Kit (CDK) is a framework for defining cloud infrastructure using real programming languages - TypeScript, Python, Java, Go, and others. Instead of writing YAML templates, you write code, and the CDK compiles it into a CloudFormation template and deploys it.

CDK doesn't replace CloudFormation - it generates it. When you run `cdk deploy`, the CDK synthesizes your code into a CloudFormation template and hands it off to the CloudFormation service. The stack shows up in the CloudFormation console like any other stack. You get the developer experience of real code and the operational reliability of CloudFormation underneath.

**Why it matters**

Two things make CDK worth the learning curve. First, type safety: your editor knows what properties a Lambda function accepts, catches typos at compile time, and autocompletes resource ARNs. Second, L2 constructs: the high-level CDK resources create IAM roles, log groups, and sensible defaults automatically - infrastructure you'd write by hand in CloudFormation comes for free.

## CDK vs CloudFormation vs Terraform

|                 | CloudFormation                 | CDK                          | Terraform                        |
| --------------- | ------------------------------ | ---------------------------- | -------------------------------- |
| **Language**    | YAML / JSON                    | TypeScript, Python, Java, Go | HCL                              |
| **Logic**       | Limited (Conditions, Mappings) | Full programming language    | Limited (loops, conditionals)    |
| **AWS support** | Native, always up to date      | Built on CloudFormation      | Third-party provider, slight lag |
| **Multi-cloud** | No                             | No                           | Yes                              |
| **IAM**         | Manual policy statements       | Grant methods                | Manual policy statements         |

For a deeper look at CDK vs CloudFormation specifically - when to use each and a side-by-side example - see [Infrastructure as Code: CDK vs CloudFormation](/articles/infrastructure-as-code-cdk-vs-cloudformation).

## Installing the CDK CLI

The CDK CLI is an npm package. You need Node.js installed even if you're writing CDK in TypeScript (which you are here).

```bash
npm install -g aws-cdk
cdk --version  # verify the install
```

You also need AWS credentials configured. If you've used the AWS CLI before, you're already set. If not:

```bash
aws configure  # prompts for access key, secret, region, output format
```

The CDK uses the same credentials and region as the AWS CLI. If `aws s3 ls` works, `cdk deploy` will too.

## Creating Your First CDK Project

Initialize a new CDK app with `cdk init`:

```bash
mkdir my-cdk-app && cd my-cdk-app
cdk init app --language typescript
npm install
```

This generates a project with the following structure:

```
my-cdk-app/
├── bin/
│   └── my-cdk-app.ts    # entry point - instantiates your stacks
├── lib/
│   └── my-cdk-app-stack.ts  # your stack definition lives here
├── cdk.json             # CDK configuration (which file is the entry point)
├── package.json
└── tsconfig.json
```

**`bin/my-cdk-app.ts`** is the entry point. It creates a CDK `App` instance and instantiates your stacks:

```typescript
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MyCdkAppStack } from "../lib/my-cdk-app-stack";

const app = new cdk.App();
new MyCdkAppStack(app, "MyCdkAppStack");
```

**`lib/my-cdk-app-stack.ts`** is where you define resources. This is the file you'll spend most of your time in:

```typescript
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // your resources go here
  }
}
```

**`cdk.json`** tells the CDK CLI which file is the entry point (`"app": "npx ts-node --prefer-ts-exts bin/my-cdk-app.ts"`). You rarely need to edit it.

## Understanding Stacks and Constructs

**Stacks** are the unit of deployment. One CDK stack becomes one CloudFormation stack. Resources in the same stack are created, updated, and deleted together. Large apps often use multiple stacks - one for networking, one for compute, one for data - to isolate changes and control deployment order.

**Constructs** are the building blocks. Everything in CDK is a construct: a Lambda function, an S3 bucket, a custom pattern that wraps several resources together. Constructs come in three levels:

| Level  | Prefix                                                  | What It Is                                                                                 |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **L1** | `Cfn*` (e.g. `CfnFunction`)                             | Direct mapping to a CloudFormation resource. Full control, no defaults.                    |
| **L2** | No prefix (e.g. `Function`, `Bucket`)                   | Opinionated wrappers with sensible defaults, grant methods, and helper properties.         |
| **L3** | Patterns (e.g. `ApplicationLoadBalancedFargateService`) | Multi-resource patterns that assemble a complete architecture. Higher level, less control. |

You'll use L2 constructs most of the time. L1 constructs are useful when you need a property that the L2 doesn't yet expose. You can access the underlying L1 from any L2:

```typescript
const cfnFn = fn.node.defaultChild as lambda.CfnFunction;
cfnFn.addPropertyOverride("SnapStart.ApplyOn", "PublishedVersions");
```

## Defining a Lambda Function in CDK

Add a Lambda function to your stack. Start with the Python handler:

```python
# lambda/handler.py
import json

def main(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Hello from CDK!"}),
    }
```

Then define it in the stack:

```typescript
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "AppTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // use RETAIN in production
    });

    const fn = new lambda.Function(this, "AppFunction", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambda"), // bundles the lambda/ directory
      environment: {
        TABLE_NAME: table.tableName, // pass the table name at deploy time
      },
    });

    table.grantReadWriteData(fn); // generates and attaches the correct IAM policy
  }
}
```

A few things CDK handles automatically here:

- **Execution role** - created with the `AWSLambdaBasicExecutionRole` managed policy attached.
- **Log group** - `/aws/lambda/AppFunction-...` is created automatically.
- **IAM policy** - `table.grantReadWriteData(fn)` generates the exact DynamoDB policy needed and attaches it to the function's role. No manual policy statements.

For a deeper look at how to build out a full API with multiple Lambda functions, see the [REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda) article.

## Deploying Your Stack

**Step 1: Bootstrap** (one time per account/region)

CDK needs an S3 bucket to stage assets (your Lambda code, CloudFormation templates) before deploying. The `bootstrap` command creates a CloudFormation stack called `CDKToolkit` that provisions this bucket:

```bash
cdk bootstrap
```

You only need to do this once per AWS account and region. If you see an error about a missing bootstrap stack, this is why.

**Step 2: Preview changes**

Before deploying, check what CDK will create or modify:

```bash
cdk diff
```

`cdk diff` compares your local stack definition against what's currently deployed in CloudFormation and prints the planned changes - resources added, removed, or modified. It's the CDK equivalent of `terraform plan` and the most useful command to run before every deploy.

**Step 3: Synthesize** (optional)

To inspect the raw CloudFormation template CDK will generate:

```bash
cdk synth
```

The output is written to `cdk.out/`. You don't need to run this before deploying - `cdk deploy` runs it automatically - but it's useful for debugging and for understanding what's actually being sent to CloudFormation.

**Step 4: Deploy**

```bash
cdk deploy
```

CDK synthesizes your code, uploads the CloudFormation template and any Lambda zip files to the bootstrap S3 bucket, and triggers a CloudFormation stack deployment. You'll see a progress indicator as resources are created:

```
MyCdkAppStack: deploying...
MyCdkAppStack | 0/3 | CREATE_IN_PROGRESS | AWS::DynamoDB::Table | AppTable
MyCdkAppStack | 1/3 | CREATE_COMPLETE     | AWS::DynamoDB::Table | AppTable
MyCdkAppStack | 2/3 | CREATE_IN_PROGRESS  | AWS::Lambda::Function | AppFunction
MyCdkAppStack | 3/3 | CREATE_COMPLETE     | AWS::Lambda::Function | AppFunction
✅ MyCdkAppStack
```

If a deployment fails, CloudFormation automatically rolls back to the previous state.

## Tearing It Down

```bash
cdk destroy
```

This deletes the CloudFormation stack and all the resources in it. CDK will prompt for confirmation before proceeding.

**Stateful resources and removal policies**

By default, DynamoDB tables and S3 buckets are protected from deletion even when the stack is destroyed - CloudFormation will fail with an error rather than delete them. This is the safe default for production.

In development, you often want cleanup to work completely. Set `removalPolicy: cdk.RemovalPolicy.DESTROY` on the resource to allow deletion, and for S3 buckets add `autoDeleteObjects: true` to empty the bucket before deleting it:

```typescript
const bucket = new s3.Bucket(this, "AppBucket", {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true, // deletes all objects before removing the bucket
});
```

Use `RemovalPolicy.RETAIN` - or leave it at the default - for any resource that holds data you care about.

## The Takeaway

- **CDK generates CloudFormation, not around it.** `cdk deploy` synthesizes your code into a CloudFormation template and deploys it through the CloudFormation service. You get real code to write infrastructure and CloudFormation reliability underneath.
- **Use L2 constructs by default.** They create execution roles, log groups, and encryption with sensible defaults. Drop to L1 (`CfnFunction`, `CfnBucket`) only when you need a property the L2 doesn't expose.
- **Grant methods replace manual IAM.** `table.grantReadWriteData(fn)` generates the exact policy needed and attaches it to the function's role. One line instead of a hand-written policy statement.
- **Bootstrap once per account/region.** `cdk bootstrap` creates the `CDKToolkit` stack and the S3 staging bucket. You only need to run it once.
- **Run `cdk diff` before every deploy.** It shows exactly what will change - resources added, modified, or removed - before anything is deployed.
- **Set `RemovalPolicy.DESTROY` in dev, `RETAIN` in prod.** Stateful resources (DynamoDB, S3) are protected from deletion by default. Be intentional about what can be destroyed automatically.
