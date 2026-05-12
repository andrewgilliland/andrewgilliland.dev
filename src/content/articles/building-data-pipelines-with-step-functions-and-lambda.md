---
title: Building Data Pipelines with Step Functions and Lambda
date: 2026-05-12
excerpt: When one Lambda isn't enough, Step Functions lets you orchestrate multi-step workflows with retries, error handling, and a full execution history built in.
draft: false
tags: ["aws", "serverless", "python", "cdk"]
---

[Structuring a Lambda API for Performance](/articles/structuring-a-lambda-api-for-performance) covers the pattern for individual Lambda functions handling single operations. But some workloads aren't a single operation - they're a sequence of steps, each of which can succeed or fail independently. Ingest a file, validate it, transform it, load it somewhere. If step two fails, you want to retry step two, not restart from step one.

Wiring this with plain Lambda invocations is fragile. One Lambda calling another means the caller has to handle the callee's errors, manage retries, and keep track of state. If the chain is long or branches, it becomes a distributed system you built by accident.

Step Functions is the alternative. You write the business logic in Lambdas. Step Functions manages the sequence, retries, error routing, and keeps a full execution history for every run.

## What Are Step Functions?

Step Functions is a serverless workflow service. You define a **state machine** - a directed graph of states and transitions - and Step Functions executes it. Each state can be a Lambda invocation, a wait, a choice branch, a parallel fan-out, or a pass-through. When a state completes, Step Functions evaluates the output and moves to the next state.

The key thing Step Functions manages that you'd otherwise manage yourself:

- **Input/output passing** - each state's output becomes the next state's input automatically
- **Retries** - configure max attempts, backoff rate, and which error types to retry, per state
- **Error routing** - catch specific failures and route them to fallback states
- **Execution history** - every execution stores a complete log of each state's input, output, and duration
- **Timeouts** - per-state and per-execution timeouts without polling loops

You don't poll for completion, manage queues, or write retry logic inside your handlers. That all lives in the state machine definition.

## When to Use Step Functions vs a Single Lambda

| Scenario                                | Approach           |
| --------------------------------------- | ------------------ |
| Single operation, completes in seconds  | Lambda alone       |
| Multiple sequential steps               | Step Functions     |
| Steps that can fail independently       | Step Functions     |
| Total duration potentially > 15 minutes | Step Functions     |
| Need audit trail of every execution     | Step Functions     |
| Parallel branches that converge         | Step Functions     |
| Simple fan-out with no convergence      | SNS or EventBridge |

The 15-minute ceiling is the hard rule - a single Lambda invocation has a maximum timeout of 15 minutes. A Step Functions execution can run for up to a year. If your pipeline fetches a large file, runs a slow transformation, and batches writes, Step Functions handles the duration even if any individual Lambda stays well under the limit.

## What We're Building

A CSV ingestion pipeline. A file lands in S3, triggers the state machine, and the pipeline validates, transforms, and loads it into DynamoDB:

```
S3 PutObject
  └─ EventBridge rule
       └─ Step Functions execution
            ├─ fetch_csv       (Lambda) - read the file from S3
            ├─ validate_csv    (Lambda) - check required fields, normalise types
            └─ load_to_dynamodb (Lambda) - batch write rows to DynamoDB
```

Project structure:

```
csv-pipeline/
├── lambdas/
│   ├── fetch_csv/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── validate_csv/
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── load_to_dynamodb/
│       ├── handler.py
│       └── requirements.txt
├── lib/
│   └── pipeline-stack.ts
├── bin/
│   └── csv-pipeline.ts
└── cdk.json
```

Same per-function layout as the structuring article - each Lambda has its own directory and its own `requirements.txt`.

## Step 1 - Fetch from S3

The state machine receives the S3 bucket and key as its input. The first Lambda reads the file and returns its contents as structured data:

```python
# lambdas/fetch_csv/handler.py
import csv
import io
import os
import boto3

_s3 = boto3.client("s3")

def main(event, context):
    bucket = event["bucket"]
    key = event["key"]

    response = _s3.get_object(Bucket=bucket, Key=key)
    content = response["Body"].read().decode("utf-8")

    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)

    return {
        "bucket": bucket,
        "key": key,
        "rows": rows,
        "count": len(rows),
    }
```

The boto3 client is initialized at module level - same pattern as the handler functions in the API articles. `csv.DictReader` turns each CSV row into a dict keyed by header column.

The return value becomes the input to the next state. Step Functions handles the pass-through automatically - no queues, no serialization code.

## Step 2 - Validate and Transform

The second Lambda receives the full output of `fetch_csv` as its event. It validates required fields and normalizes types:

```python
# lambdas/validate_csv/handler.py
from datetime import datetime

REQUIRED_FIELDS = {"id", "name", "amount", "date"}

def main(event, context):
    rows = event["rows"]
    errors = []
    cleaned = []

    for i, row in enumerate(rows):
        missing = REQUIRED_FIELDS - row.keys()
        if missing:
            errors.append({"row": i, "error": f"Missing fields: {missing}"})
            continue

        try:
            cleaned.append({
                "pk": f"ROW#{row['id']}",
                "id": row["id"],
                "name": row["name"].strip(),
                "amount": float(row["amount"]),
                "date": datetime.strptime(row["date"], "%Y-%m-%d").isoformat(),
            })
        except (ValueError, KeyError) as e:
            errors.append({"row": i, "error": str(e)})

    if errors:
        # Raise to trigger the catch in the state machine
        raise ValueError(f"Validation failed: {errors}")

    return {
        "rows": cleaned,
        "count": len(cleaned),
        "source_key": event["key"],
    }
```

**Raising on validation failure is intentional.** When this Lambda raises, Step Functions catches the error at the state machine level and routes it to the error handler - the rest of the pipeline doesn't run. If you returned a result with an `errors` field instead, the next state would still execute with bad data.

## Step 3 - Load to DynamoDB

The third Lambda receives the validated rows and batch-writes them:

```python
# lambdas/load_to_dynamodb/handler.py
import os
import boto3

_table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def main(event, context):
    rows = event["rows"]

    with _table.batch_writer() as batch:
        for row in rows:
            batch.put_item(Item=row)

    return {
        "loaded": len(rows),
        "source_key": event["source_key"],
    }
```

`batch_writer()` handles batching into groups of 25 (DynamoDB's batch write limit) and automatically retries unprocessed items. You write a loop; the SDK handles the rest.

## The CDK Stack

```typescript
// lib/pipeline-stack.ts
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "CsvBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const table = new dynamodb.Table(this, "ResultsTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const commonProps: Omit<lambda.FunctionProps, "handler" | "code"> = {
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
    };

    const fetchCsvFn = new lambda.Function(this, "FetchCsv", {
      ...commonProps,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambdas/fetch_csv"),
      environment: { BUCKET_NAME: bucket.bucketName },
    });

    const validateCsvFn = new lambda.Function(this, "ValidateCsv", {
      ...commonProps,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambdas/validate_csv"),
    });

    const loadFn = new lambda.Function(this, "LoadToDynamoDB", {
      ...commonProps,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambdas/load_to_dynamodb"),
      environment: { TABLE_NAME: table.tableName },
    });

    bucket.grantRead(fetchCsvFn);
    table.grantWriteData(loadFn);

    // State machine tasks
    const fetchStep = new tasks.LambdaInvoke(this, "FetchCsvStep", {
      lambdaFunction: fetchCsvFn,
      outputPath: "$.Payload",
    });

    const validateStep = new tasks.LambdaInvoke(this, "ValidateCsvStep", {
      lambdaFunction: validateCsvFn,
      outputPath: "$.Payload",
    }).addRetry({
      errors: ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
      maxAttempts: 2,
      backoffRate: 2,
    });

    const loadStep = new tasks.LambdaInvoke(this, "LoadStep", {
      lambdaFunction: loadFn,
      outputPath: "$.Payload",
    }).addRetry({
      errors: ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
      maxAttempts: 3,
      backoffRate: 2,
    });

    const validationFailed = new sfn.Fail(this, "ValidationFailed", {
      error: "ValidationError",
      cause: "One or more rows failed validation",
    });

    validateStep.addCatch(validationFailed, {
      errors: ["ValueError"],
    });

    const definition = fetchStep.next(validateStep).next(loadStep);

    const stateMachine = new sfn.StateMachine(this, "CsvPipeline", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(30),
    });

    // Trigger: S3 PutObject → EventBridge → Step Functions
    const rule = new events.Rule(this, "CsvUploadRule", {
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["Object Created"],
        detail: {
          bucket: { name: [bucket.bucketName] },
          object: { key: [{ suffix: ".csv" }] },
        },
      },
    });

    rule.addTarget(
      new targets.SfnStateMachine(stateMachine, {
        input: events.RuleTargetInput.fromObject({
          bucket: events.EventField.fromPath("$.detail.bucket.name"),
          key: events.EventField.fromPath("$.detail.object.key"),
        }),
      }),
    );

    new cdk.CfnOutput(this, "StateMachineArn", {
      value: stateMachine.stateMachineArn,
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
  }
}
```

A few decisions worth calling out:

**`outputPath: "$.Payload"`** unwraps the Lambda response from Step Functions' envelope. Without it, each state's output is `{"Payload": {...}, "StatusCode": 200, ...}` and the next Lambda receives the whole wrapper. `$.Payload` passes just the dict your handler returned.

**`addRetry` on infrastructure errors only.** The retry here targets Lambda service errors - transient failures from AWS, not from your code. `ValueError` from validation is not retried - it's caught and routed to the `Fail` state instead. Retrying a validation failure would just fail again.

**`addCatch` on the validate step only.** Fetch failures (missing file, permissions) and load failures (DynamoDB errors) are also worth catching. Adding catches for those is the same pattern - create a `Fail` state and call `.addCatch()` on the step.

## Error Handling and Retries

Step Functions separates two failure modes:

**Transient failures** - Lambda cold start timeouts, service throttling, network blips. These are worth retrying. Use `.addRetry()`:

```typescript
step.addRetry({
  errors: ["Lambda.ServiceException", "Lambda.TooManyRequestsException"],
  maxAttempts: 3,
  backoffRate: 2, // wait doubles each attempt: 1s → 2s → 4s
  interval: cdk.Duration.seconds(1),
});
```

**Business logic failures** - validation errors, missing data, schema mismatches. These won't succeed on retry. Use `.addCatch()`:

```typescript
step.addCatch(failureState, {
  errors: ["ValueError", "KeyError"],
  resultPath: "$.error", // preserve the error in the execution output
});
```

`resultPath: "$.error"` is worth setting - it adds the error details to the execution's output JSON rather than discarding them. This makes debugging easier when you look at failed executions in the console.

## Triggering from S3

The CDK stack above wires the S3 trigger via EventBridge. S3 EventBridge notifications need to be enabled on the bucket - add `eventBridgeEnabled: true` to the bucket definition:

```typescript
const bucket = new s3.Bucket(this, "CsvBucket", {
  eventBridgeEnabled: true,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});
```

Without `eventBridgeEnabled`, S3 won't emit events to EventBridge and the rule will never fire.

To start an execution manually during development:

```bash
aws stepfunctions start-execution \
  --state-machine-arn $STATE_MACHINE_ARN \
  --input '{"bucket": "my-bucket", "key": "data/test.csv"}'
```

## Monitoring Executions

The Step Functions console shows every execution with a visual graph. Click any execution to see:

- Each state's input and output JSON
- Duration per state
- The exact error and stack trace for failed states

For alerting, create a CloudWatch alarm on the `ExecutionsFailed` metric:

```typescript
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

new cloudwatch.Alarm(this, "PipelineFailureAlarm", {
  metric: stateMachine.metricFailed(),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: "CSV pipeline execution failed",
});
```

`stateMachine.metricFailed()` is a CDK helper that creates the right CloudWatch metric reference for you. The alarm triggers on any failure. Wire it to an SNS topic and Slack for operational visibility - [CloudWatch Alarms with SNS and Slack](/articles/cloudwatch-alarms-with-sns-and-slack) covers the notification setup.

## The Takeaway

- **Step Functions manages state, not business logic.** Your Lambdas stay focused on single operations. Step Functions handles the sequence, retries, and error routing.
- **`outputPath: "$.Payload"`** is almost always what you want on a `LambdaInvoke` step. Without it, every downstream Lambda receives Step Functions' metadata wrapper instead of your handler's return value.
- **Raise exceptions for failures you don't want to retry.** Step Functions catches them and routes to a `Fail` state. Returning an error object in a successful response bypasses the state machine's error handling entirely.
- **Separate transient retries from logic failures.** Use `.addRetry()` for infrastructure errors. Use `.addCatch()` for business logic failures that will never succeed on retry.
- **Enable `eventBridgeEnabled` on the S3 bucket.** Without it, S3 doesn't emit events and the EventBridge trigger rule never fires.
- **The Step Functions console is your debugging tool.** Every execution stores the full input/output chain. You don't need to add logging to each Lambda to understand what happened - the execution history shows it.

For the Lambda handler patterns this pipeline builds on, see [Structuring a Lambda API for Performance](/articles/structuring-a-lambda-api-for-performance). For event-driven triggering patterns beyond S3, see [Amazon EventBridge](/articles/amazon-eventbridge).
