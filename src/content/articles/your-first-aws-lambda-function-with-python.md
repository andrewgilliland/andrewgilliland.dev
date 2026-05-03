---
title: Your First AWS Lambda Function with Python
date: 2026-04-12
excerpt: Write, test, and deploy a Python Lambda function from scratch. No prior AWS experience needed.
draft: false
tags: ["aws", "python", "serverless"]
---

You've heard about serverless. You know Lambda is AWS's version of it. Now you want to actually build something with it. This article skips the theory and walks you through writing, testing, and deploying a real Python Lambda function from scratch.

By the end, you'll have a working Lambda that you can invoke from the command line, and you'll understand the core concepts well enough to extend it.

## What Is AWS Lambda?

Lambda is AWS's serverless compute service. You write a function, deploy it, and AWS handles the servers, operating system, runtime environment, and scaling. You pay only for the time your code actually runs, measured in milliseconds.

The mental model is simple: **event in → your code runs → result out**. Lambda doesn't run a persistent process. It receives an event, invokes your handler, and tears the environment down when it's done.

## The Handler Function

Every Lambda function has a **handler** - the entry point Lambda calls when an event arrives. In Python it looks like this:

```python
def handler(event, context):
    return {
        "statusCode": 200,
        "body": "Hello from Lambda!"
    }
```

Two arguments, always. **`event`** is a Python dict containing the triggering payload - its shape depends on what triggered the function (API Gateway, S3, EventBridge, a direct invocation, etc.). **`context`** contains runtime metadata like function name, memory limit, request ID, and time remaining. You rarely need it for simple functions.

The return value also depends on the trigger. For API Gateway, you return a dict with `statusCode` and `body`. For S3 or EventBridge triggers, Lambda ignores the return value entirely.

## Setting Up Your AWS Account

If you don't have an AWS account yet, create one at [aws.amazon.com](https://aws.amazon.com). New accounts get 12 months of free tier access, and Lambda is extremely cheap even outside the free tier - 1 million requests per month are free forever.

Once your account is set up, install the AWS CLI:

```bash
# macOS
brew install awscli

# verify
aws --version
```

Then configure it with your credentials:

```bash
aws configure
```

You'll be prompted for four things. Your **AWS Access Key ID** and **AWS Secret Access Key** - create these in the IAM console under your user → Security credentials → Access keys (the secret key is shown only once, copy it). Your **default region** - use `us-east-1` to start. And your **default output format** - `json` works fine.

## Writing the Handler

Create a new directory and file:

```bash
mkdir my-first-lambda
cd my-first-lambda
touch lambda_function.py
```

Write a simple handler that reads a name from the event and returns a greeting:

```python
import json


def handler(event, context):
    name = event.get("name", "World")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": f"Hello, {name}!",
        })
    }
```

This reads a `name` key from the incoming event, defaults to `"World"` if it's missing, and returns a JSON response.

## Testing Locally

You don't need to deploy to test Lambda logic. Because the handler is just a Python function, you can call it directly:

```python
# test_lambda.py
from lambda_function import handler

event = {"name": "Andrew"}
result = handler(event, None)  # context can be None for local testing

print(result)
# {'statusCode': 200, 'body': '{"message": "Hello, Andrew!"}'}
```

Run it:

```bash
python test_lambda.py
```

For more realistic local testing, [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) can simulate the full Lambda runtime locally with `sam local invoke`, but for most functions the plain Python approach above is fast enough during development.

## Deploying with the AWS CLI

Lambda runs your code from a ZIP file. Package the function:

```bash
zip function.zip lambda_function.py
```

If your function has third-party dependencies, install them into the same directory first:

```bash
pip install requests -t .
zip -r function.zip .
```

Now create the Lambda function. You'll need an **IAM execution role** first - this is the role Lambda assumes when running your code. Create a basic one:

```bash
aws iam create-role \
  --role-name lambda-basic-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

Attach the basic execution policy so Lambda can write logs to CloudWatch:

```bash
aws iam attach-role-policy \
  --role-name lambda-basic-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Note the `Arn` from the `create-role` output - you need it for the next step. It looks like `arn:aws:iam::123456789012:role/lambda-basic-role`.

Create the function:

```bash
aws lambda create-function \
  --function-name my-first-lambda \
  --runtime python3.13 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-basic-role \
  --handler lambda_function.handler \
  --zip-file fileb://function.zip
```

`--handler` uses the format `filename.function_name` - so `lambda_function.handler` means the `handler` function inside `lambda_function.py`.

To update the function after making changes:

```bash
zip function.zip lambda_function.py

aws lambda update-function-code \
  --function-name my-first-lambda \
  --zip-file fileb://function.zip
```

## Invoking Your Function

Invoke it directly from the CLI:

```bash
aws lambda invoke \
  --function-name my-first-lambda \
  --payload '{"name": "Andrew"}' \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json
# {"statusCode": 200, "body": "{\"message\": \"Hello, Andrew!\"}"}
```

The `--cli-binary-format raw-in-base64-out` flag tells the CLI to accept your payload as plain JSON rather than base64. The response is written to `response.json` and the terminal shows a summary with `"StatusCode": 200`.

## Viewing Logs in CloudWatch

Lambda automatically ships `print()` output and exceptions to CloudWatch Logs. Add some logging to your function:

```python
import json


def handler(event, context):
    name = event.get("name", "World")
    print(f"Received event: {event}")
    print(f"Saying hello to: {name}")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": f"Hello, {name}!",
        })
    }
```

After invoking, view the logs:

```bash
# List log streams for the function
aws logs describe-log-streams \
  --log-group-name /aws/lambda/my-first-lambda \
  --order-by LastEventTime \
  --descending \
  --max-items 1

# Get the latest log events (replace LOG_STREAM_NAME with the stream name from above)
aws logs get-log-events \
  --log-group-name /aws/lambda/my-first-lambda \
  --log-stream-name "LOG_STREAM_NAME"
```

Or just open the AWS console: CloudWatch → Log groups → `/aws/lambda/my-first-lambda`.

In production, use `logging` instead of `print` for structured output:

```python
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    name = event.get("name", "World")
    logger.info("Received event", extra={"event": event})

    return {
        "statusCode": 200,
        "body": json.dumps({"message": f"Hello, {name}!"})
    }
```

## The Takeaway

You now have a working Lambda function deployed to AWS. The core pattern - handler receives an event, does work, returns a result - stays the same regardless of what you build on top of it.

From here, connect API Gateway to give your function an HTTP endpoint, or add environment variables to pass config without hardcoding it ([Environment Variables and SSM Parameter Store](/articles/environment-variables-secrets-and-ssm-parameter-store)). When you're ready to stop using the CLI and manage infrastructure properly, [Intro to AWS CDK](/articles/intro-to-aws-cdk) covers that transition. And once your function is live, [Monitoring and Observability on AWS](/articles/monitoring-and-observability-on-aws) walks through setting up alarms and structured logging.

The CLI deployment here is intentionally manual - it shows you what's happening under the hood. In practice, you'd define your function in CDK or SAM and let the tooling handle packaging and deployment.
