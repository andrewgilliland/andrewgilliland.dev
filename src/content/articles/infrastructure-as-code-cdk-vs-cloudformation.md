---
title: "Infrastructure as Code: CDK vs CloudFormation"
date: 2026-04-11
excerpt: CloudFormation uses YAML. CDK uses TypeScript. Here's when to use each and why CDK feels like a superpower.
draft: false
---

## What Is Infrastructure as Code?

Infrastructure as Code (IaC) means managing cloud resources through version-controlled code instead of clicking through the AWS console. Instead of manually creating an S3 bucket, you write a file that describes it and let a tool create it for you. The file lives in git - it's reviewable, auditable, repeatable, and can be deployed to multiple environments without drift.

On AWS, there are two dominant IaC tools: **CloudFormation**, which is AWS's native service, and **CDK** (Cloud Development Kit), which is an abstraction built on top of it. They're not competing tools - CDK compiles down to CloudFormation. The question is how you want to write your infrastructure: YAML or code.

## CloudFormation Basics

CloudFormation takes a template - a JSON or YAML file - and deploys it as a **stack**. A stack is a collection of AWS resources that are created, updated, and deleted together. You write the template, upload it, and CloudFormation figures out what to create.

| Term          | What It Is                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| **Template**  | The YAML or JSON file that describes your infrastructure.                                                      |
| **Stack**     | A deployed instance of a template. One template can be deployed as multiple stacks (e.g., dev, staging, prod). |
| **Resource**  | A single AWS resource defined in the template - a Lambda function, an S3 bucket, an IAM role.                  |
| **Output**    | A value exported from the stack - an ARN, a URL - that other stacks or systems can reference.                  |
| **Parameter** | An input value passed to the template at deploy time - an environment name, an instance type.                  |

A CloudFormation resource for a Lambda function looks like this:

```yaml
MyFunction:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: my-function
    Runtime: python3.12
    Handler: handler.main
    Role: !GetAtt MyFunctionRole.Arn
    Code:
      S3Bucket: my-deploy-bucket
      S3Key: my-function.zip
```

That's just the function. Now you need an IAM role for it, a policy attached to that role, a log group, and permissions for the log group. The YAML adds up fast.

## Where CloudFormation Falls Short

CloudFormation works, and it's battle-tested. But writing it by hand surfaces some real friction.

**Verbosity.** A Lambda function with an execution role, log group, and basic permissions is 100+ lines of YAML. Most of it is boilerplate you'd write the same way every time.

**No real logic.** CloudFormation has `Conditions` and `Mappings` for limited branching, but there are no loops. If you want five identical resources, you write five identical blocks - or reach for macros, which have their own complexity.

**String-based references.** Resources reference each other with `!Ref`, `!Sub`, and `!GetAtt`. These are strings. A typo - `!GetAtt MyFuncton.Arn` - won't be caught until the deploy fails. There's no autocomplete, no type checking, no lint error.

**IAM is fully manual.** Every permission statement is hand-written. You look up the exact action string (`logs:CreateLogGroup`), the right resource pattern, and write the policy yourself. Get it wrong and the function fails at runtime.

**Reuse requires copy-paste.** If you want a reusable pattern - three Lambda functions that follow the same structure - you copy the blocks and manually keep them in sync. Nested stacks exist but add operational complexity.

## How CDK Fixes It

CDK is a framework for defining cloud infrastructure using real programming languages - TypeScript, Python, Java, Go, and others. You write code, run `cdk deploy`, and CDK takes care of the rest.

The same Lambda function in CDK TypeScript:

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";

const fn = new lambda.Function(this, "MyFunction", {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: "handler.main",
  code: lambda.Code.fromAsset("lambda"),
});
```

That's it. CDK creates the execution role, attaches the `AWSLambdaBasicExecutionRole` managed policy, and creates the log group - all automatically through sensible defaults built into the L2 construct.

### How CDK Works Under the Hood

CDK doesn't bypass CloudFormation - it generates it. When you run `cdk synth`, CDK compiles your TypeScript code into a CloudFormation template. When you run `cdk deploy`, it deploys that template through the CloudFormation service. The stack shows up in the CloudFormation console like any other stack.

```bash
cdk synth   # produces a CloudFormation template in cdk.out/
cdk deploy  # deploys via CloudFormation
```

This means CDK inherits all of CloudFormation's guarantees: rollback on failure, drift detection, change sets. You get the developer experience of real code and the operational reliability of CloudFormation.

### L2 Constructs and Grant Methods

CDK resources come in levels. L1 constructs (`CfnFunction`, `CfnBucket`) are direct mappings to CloudFormation resources - verbose, full control. L2 constructs (`Function`, `Bucket`, `Table`) are the opinionated higher-level versions with sensible defaults and helper methods.

The most useful helper pattern is grant methods for IAM:

```typescript
const table = new dynamodb.Table(this, "EventsTable", {
  partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
});

// Generates the correct IAM policy and attaches it to the function's role
table.grantReadWriteData(fn);
```

One line instead of a hand-written IAM policy statement. The grant methods know exactly which actions are needed and scope them to the correct resource ARN.

### CDK vs CloudFormation

|                    | CloudFormation                 | CDK                                |
| ------------------ | ------------------------------ | ---------------------------------- |
| **Language**       | YAML / JSON                    | TypeScript, Python, Java, Go       |
| **Logic**          | Limited (Conditions, Mappings) | Full programming language          |
| **Type safety**    | None                           | Compile-time errors                |
| **IAM**            | Write policies manually        | Grant methods (`grantRead`, etc.)  |
| **Reuse**          | Nested stacks, macros          | Classes, functions, npm packages   |
| **Output**         | Native CloudFormation          | Synthesizes to CloudFormation      |
| **Learning curve** | Lower initially                | Higher initially, pays off quickly |

## A Side-by-Side Example

Here's the same infrastructure in both tools: a Lambda function with an execution role that can write to CloudWatch Logs.

**CloudFormation - ~60 lines for a minimal Lambda + role**

```yaml
AWSTemplateFormatVersion: "2010-09-09"

Resources:
  MyFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: my-function-role
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LogsPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/my-function:*"

  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: my-function
      Runtime: python3.12
      Handler: handler.main
      Role: !GetAtt MyFunctionRole.Arn
      Code:
        S3Bucket: my-deploy-bucket
        S3Key: my-function.zip
      Environment:
        Variables:
          STAGE: production

  MyFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/my-function
      RetentionInDays: 30
```

That's the minimum. Add a DynamoDB table permission, an SQS queue, or an API Gateway integration and you're copying IAM statement blocks and updating ARN patterns by hand.

**CDK TypeScript - ~15 lines for the same resources**

```typescript
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, "MyFunction", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambda"), // bundles local directory
      environment: { STAGE: "production" },
      logRetention: logs.RetentionDays.ONE_MONTH, // log group + retention, automatic
    });
    // execution role with CloudWatch Logs permissions created automatically
  }
}
```

The execution role is created automatically with the right trust policy and `AWSLambdaBasicExecutionRole`. The log group is created with the correct name and retention. If you later need DynamoDB access, you call `table.grantReadWriteData(fn)` - one line, correct policy, correct scope.

The output of `cdk synth` on this TypeScript is a CloudFormation template that looks like the YAML above. You write 15 lines; CloudFormation gets 60+.

## When CloudFormation Still Makes Sense

CDK is the better default, but there are situations where raw CloudFormation is the right choice.

**You're distributing templates to others.** Service Catalog, AWS Marketplace, and cross-account deployments often require a standalone CloudFormation template as the artifact. CDK's `cdk synth` can produce this template, but if the consumer is using the template directly, plain YAML is simpler to hand off.

**You're reading someone else's infrastructure.** If you inherit a CloudFormation stack, understanding what it does means reading the template. You don't need CDK to audit or modify it - the YAML is the source of truth.

**Escape hatch: `CfnResource`.** When CDK's L2 constructs don't expose a property you need, you can drop down to the raw CloudFormation resource:

```typescript
const cfnFn = fn.node.defaultChild as lambda.CfnFunction;
cfnFn.addPropertyOverride("SnapStart.ApplyOn", "PublishedVersions");
```

This gives you CDK's developer experience for most of the stack and raw access where you need it.

**Your stack is fully static.** If the infrastructure has no logic, no reuse, and no IAM complexity - a single S3 bucket with a policy - CloudFormation is fine. CDK adds a build step and a dependency on the CDK CLI. That overhead isn't always worth it.

## The Takeaway

- **CDK compiles to CloudFormation, not around it.** `cdk synth` produces a real CloudFormation template. You get CDK's developer experience and CloudFormation's operational guarantees - rollback, drift detection, change sets.
- **L2 constructs eliminate most boilerplate.** The CDK `Function`, `Table`, and `Bucket` constructs create the IAM roles, log groups, and sensible defaults that you'd write by hand in CloudFormation.
- **Grant methods replace hand-written IAM policies.** `table.grantReadWriteData(fn)` generates the exact policy needed and scopes it to the right resource. No more looking up action strings and ARN patterns.
- **CloudFormation is still the deployment layer.** When CDK doesn't expose what you need, drop down to `CfnResource` - you're still in CloudFormation territory, just with TypeScript on top.
- **CloudFormation templates are the right artifact for distribution.** If you're handing infrastructure to Service Catalog, Marketplace, or another team that will deploy directly, produce the template with `cdk synth` or write it directly.
- **Use CDK by default.** The learning curve is real but short. Once you've written one stack, the type safety, grant methods, and reusable constructs make it hard to go back to YAML.
