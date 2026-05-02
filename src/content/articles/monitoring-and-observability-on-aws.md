---
title: Monitoring and Observability on AWS
date: 2026-04-21
excerpt: Your code is deployed. Now make sure it stays healthy. Here's how to monitor Lambda functions with CloudWatch.
draft: false
tags: ["aws", "monitoring"]
---

Deploying a Lambda function is straightforward. Knowing what it's doing after it's deployed is a different problem. Lambda's execution model - ephemeral environments, no persistent process, logs scattered across execution environments - makes traditional debugging impossible. You can't SSH in. You can't attach a debugger. You can't tail a server log. Everything you know about a running Lambda function comes from what it explicitly emits.

Observability is the practice of building that visibility in from the start: structured logs that are queryable, metrics that tell you when something is wrong, and traces that show you where in a request chain the problem occurred. AWS provides the infrastructure for all three. This article covers how to use it with Lambda.

## Why Monitoring Matters

Observability breaks down into three pillars:

**Logs** are discrete records of what happened at a specific point in time. A function started. An API call returned an error. A record was processed. Logs are the most detailed source of truth, but they don't aggregate or alert - you have to query them.

**Metrics** are numeric measurements over time. Error rate, duration percentiles, invocation count. Metrics are the right tool for alerting because they're cheap to evaluate, easy to graph, and fast to query at scale.

**Traces** are end-to-end records of a single request as it flows through multiple services. A trace shows that a specific user request hit your API Gateway, invoked a Lambda function, made a call to DynamoDB, and returned - with timing for each hop.

Lambda's ephemeral model makes all three harder to set up than on a traditional server:

- There's no single log file. Logs are partitioned by execution environment into separate **log streams**, and a busy function can have dozens of streams active at once.
- AWS emits some metrics automatically, but error rates and custom business metrics require explicit instrumentation.
- Tracing doesn't happen by default. You have to enable it and instrument your code.

None of this is hard to set up, but it doesn't happen automatically. The rest of this article covers the practical setup for each pillar.

## CloudWatch Logs Basics

Every Lambda function automatically writes to CloudWatch Logs. Anything your function prints to stdout or stderr - including Python's `print()` - appears in the logs without any extra configuration.

CloudWatch Logs organizes log output in two levels:

- **Log group:** one per Lambda function, named `/aws/lambda/<function-name>`. This is the container for all log data from that function.
- **Log stream:** one per execution environment. When Lambda creates a new execution environment (on cold start), it creates a new log stream. A high-concurrency function may have many streams active simultaneously. Log streams are the reason you can't just tail a single file.

### Retention

By default, CloudWatch Logs retains log data indefinitely. This gets expensive. Set a retention policy on every log group. In CDK:

```typescript
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";

const fn = new lambda.Function(this, "MyFunction", {
  // ...
  logRetention: logs.RetentionDays.ONE_MONTH,
});
```

Or set it separately on an existing log group:

```typescript
new logs.LogGroup(this, "FunctionLogGroup", {
  logGroupName: `/aws/lambda/${fn.functionName}`,
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

Common choices: `ONE_WEEK` for high-volume debug logs, `ONE_MONTH` for general application logs, `THREE_MONTHS` or `SIX_MONTHS` for audit-relevant logs.

### CloudWatch Logs Insights

The CloudWatch Logs console includes a query engine called **Logs Insights** that lets you search across all log streams in a log group simultaneously. This is how you search logs from a high-concurrency function without trawling through individual streams.

Find all errors in the last hour:

```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 50
```

Find the slowest invocations:

```
filter @type = "REPORT"
| fields @requestId, @duration
| sort @duration desc
| limit 20
```

Count errors by minute:

```
filter @message like /ERROR/
| stats count() as errorCount by bin(1m)
```

The `REPORT` log line that Lambda emits at the end of every invocation is particularly useful - it contains `Duration`, `Billed Duration`, `Memory Size`, `Max Memory Used`, and (on cold starts) `Init Duration`.

## Structured Logging in Python

Plain text log messages are readable but not queryable. If your log line is `"Processing order 12345"`, you can grep for it. If it's `{"event": "order_processed", "order_id": "12345", "duration_ms": 42}`, you can query by any field in Logs Insights, filter by `order_id`, aggregate by `event`, and graph `duration_ms` over time.

The standard approach in Python is to log JSON to stdout using the `json` module and the built-in `logging` library:

```python
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def log(level: str, event: str, **kwargs) -> None:
    logger.log(
        getattr(logging, level.upper()),
        json.dumps({"level": level, "event": event, **kwargs}),
    )


def lambda_handler(event, context):
    log("info", "invocation_start", request_id=context.aws_request_id)

    try:
        order_id = event["order_id"]
        result = process_order(order_id)
        log("info", "order_processed", order_id=order_id, result=result)
        return {"statusCode": 200, "body": json.dumps(result)}
    except KeyError:
        log("error", "missing_field", field="order_id", request_id=context.aws_request_id)
        return {"statusCode": 400, "body": "Missing order_id"}
    except Exception as e:
        log("error", "unhandled_exception", error=str(e), request_id=context.aws_request_id)
        raise
```

A few conventions worth following:

- **Always include `context.aws_request_id`.** Every Lambda invocation has a unique request ID. Including it in every log line means you can filter Logs Insights by `request_id` to see everything that happened in a single invocation, even across multiple log streams.
- **Use structured fields instead of formatted strings.** `order_id=order_id` is queryable; `f"Processing order {order_id}"` is not.
- **Log at the start and end of meaningful operations**, not every line. Too much logging is expensive and noisy.
- **Re-raise exceptions after logging them.** Lambda only marks an invocation as an error if the handler raises. If you swallow exceptions, your error metrics will look healthy when they're not.

Logs Insights query to find all events for a specific request:

```
filter request_id = "your-request-id-here"
| fields @timestamp, level, event
| sort @timestamp asc
```

## CloudWatch Metrics

AWS emits a set of metrics for every Lambda function automatically. No instrumentation required - they appear in CloudWatch under the `AWS/Lambda` namespace. The key metrics:

| Metric                           | What it measures                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `Invocations`                    | Total number of times the function was invoked                                     |
| `Errors`                         | Invocations that resulted in an error (handler threw, timed out, or out-of-memory) |
| `Duration`                       | Execution time per invocation, in milliseconds                                     |
| `Throttles`                      | Invocations rejected because concurrency was exhausted                             |
| `ConcurrentExecutions`           | Number of execution environments running simultaneously                            |
| `UnreservedConcurrentExecutions` | Concurrent executions drawing from the account-level concurrency pool              |

The most operationally useful derived metric is **error rate**: `Errors / Invocations`. CloudWatch doesn't compute this automatically, but you can use a metric math expression in alarms and dashboards.

### Monitoring Lambda Cold Starts

Cold starts appear in the `REPORT` log line as `Init Duration`. There's no dedicated CloudWatch metric for cold starts, but you can surface them in two ways.

**Logs Insights** - query for `REPORT` lines that contain `Init Duration`:

```
filter @type = "REPORT"
| filter @initDuration > 0
| stats
    count() as coldStarts,
    avg(@initDuration) as avgInitMs,
    max(@initDuration) as maxInitMs
  by bin(1h)
```

**Metric filter** - create a CloudWatch metric filter on the log group to emit a numeric metric when `Init Duration` appears. In CDK:

```typescript
const logGroup = logs.LogGroup.fromLogGroupName(
  this,
  "FnLogGroup",
  `/aws/lambda/${fn.functionName}`,
);

const coldStartMetric = new logs.MetricFilter(this, "ColdStartFilter", {
  logGroup,
  metricNamespace: "MyApp/Lambda",
  metricName: "ColdStarts",
  filterPattern: logs.FilterPattern.literal("[report=REPORT, ...]"),
  metricValue: "1",
});
```

For most workloads, tracking cold start frequency via Logs Insights queries is sufficient. A metric filter makes sense if you want to alarm on cold start rate.

## Setting Up Alarms

CloudWatch Alarms watch a metric and change state when it crosses a threshold. The practical minimum for a Lambda function is an alarm on `Errors` - so you know when your function is failing.

A CDK alarm on error count over 5 minutes:

```typescript
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cw_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

const errorAlarm = new cloudwatch.Alarm(this, "FunctionErrorAlarm", {
  metric: fn.metricErrors({
    period: cdk.Duration.minutes(5),
    statistic: "Sum",
  }),
  threshold: 1,
  evaluationPeriods: 1,
  comparisonOperator:
    cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmDescription: "Lambda function errors in the last 5 minutes",
});
```

For high-volume functions, alarm on **error rate** instead of raw count to avoid false positives. Use metric math:

```typescript
const invocations = fn.metricInvocations({ period: cdk.Duration.minutes(5) });
const errors = fn.metricErrors({ period: cdk.Duration.minutes(5) });

const errorRate = new cloudwatch.MathExpression({
  expression: "errors / invocations * 100",
  usingMetrics: { errors, invocations },
  period: cdk.Duration.minutes(5),
  label: "Error Rate (%)",
});

const errorRateAlarm = new cloudwatch.Alarm(this, "ErrorRateAlarm", {
  metric: errorRate,
  threshold: 5, // alert if error rate exceeds 5%
  evaluationPeriods: 2,
  comparisonOperator:
    cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});
```

### Alerting with SNS

An alarm in ALARM state by itself doesn't notify anyone. Wire it to an SNS topic to send alerts via email, SMS, or a downstream webhook:

```typescript
const alertTopic = new sns.Topic(this, "AlertTopic", {
  displayName: "Lambda Alerts",
});

alertTopic.addSubscription(
  new sns_subscriptions.EmailSubscription("you@example.com"),
);

errorRateAlarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));
errorRateAlarm.addOkAction(new cw_actions.SnsAction(alertTopic)); // notify on recovery too
```

The `addOkAction` line sends a recovery notification when the alarm returns to OK state - useful so you know when a problem resolves without watching the console.

For Slack or PagerDuty, add a Lambda function as the SNS subscriber that forwards the notification to the appropriate webhook. SNS itself doesn't know about those services.

## X-Ray for Tracing

CloudWatch Logs tells you what happened inside a function. X-Ray tells you how a request moved through your system - from API Gateway to Lambda to DynamoDB - with timing for each segment. This is the right tool when you're debugging latency problems or trying to understand which service in a chain is the bottleneck.

### Enabling Active Tracing

Enable X-Ray tracing on the Lambda function. In CDK:

```typescript
const fn = new lambda.Function(this, "MyFunction", {
  // ...
  tracing: lambda.Tracing.ACTIVE,
});
```

`ACTIVE` means Lambda samples and records trace segments for every invocation. `PASS_THROUGH` means Lambda records only if the upstream caller (e.g., API Gateway) has tracing enabled and passes a trace header.

### Instrumenting boto3 Calls

Enabling tracing on the function records the Lambda invocation segment, but downstream calls to AWS services (DynamoDB, S3, SQS) won't appear in the trace unless you instrument them. The AWS X-Ray SDK patches boto3 to add subsegments automatically:

```python
# requirements.txt
# aws-xray-sdk

from aws_xray_sdk.core import xray_recorder, patch_all

# Patch all supported AWS SDK clients at module load time
patch_all()


def lambda_handler(event, context):
    # DynamoDB, S3, SQS calls made via boto3 will now appear as
    # subsegments in the X-Ray trace automatically
    import boto3
    table = boto3.resource("dynamodb").Table("my-table")
    item = table.get_item(Key={"pk": event["id"]})
    return item.get("Item")
```

`patch_all()` at module level (outside the handler) patches boto3 once on cold start and reuses the patched clients across warm invocations. Calling it inside the handler would repatch on every invocation.

### Reading the Service Map

After enabling tracing and invoking the function, open **CloudWatch > X-Ray traces > Service map** in the AWS console. You'll see a graph of connected nodes - each AWS service your function called, with error rates and average latency on each edge. Click a node to see individual traces; click a trace to see the full timeline broken down by segment and subsegment.

The service map is the fastest way to answer "which service is slow?" without reading individual log lines.

## Dashboards

A CloudWatch Dashboard puts your key metrics in a single view. Instead of navigating between the Lambda console, Logs Insights, and Alarms, a dashboard gives you an at-a-glance health summary for a function or a group of functions.

A CDK dashboard with invocations, errors, and duration:

```typescript
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

const dashboard = new cloudwatch.Dashboard(this, "LambdaDashboard", {
  dashboardName: "lambda-operations",
});

dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: "Invocations & Errors",
    left: [
      fn.metricInvocations({
        statistic: "Sum",
        period: cdk.Duration.minutes(5),
      }),
    ],
    right: [
      fn.metricErrors({ statistic: "Sum", period: cdk.Duration.minutes(5) }),
    ],
    width: 12,
  }),
  new cloudwatch.GraphWidget({
    title: "Duration (p50 / p99)",
    left: [
      fn.metricDuration({
        statistic: "p50",
        period: cdk.Duration.minutes(5),
        label: "p50",
      }),
      fn.metricDuration({
        statistic: "p99",
        period: cdk.Duration.minutes(5),
        label: "p99",
      }),
    ],
    width: 12,
  }),
  new cloudwatch.GraphWidget({
    title: "Throttles",
    left: [
      fn.metricThrottles({ statistic: "Sum", period: cdk.Duration.minutes(5) }),
    ],
    width: 12,
  }),
  new cloudwatch.AlarmStatusWidget({
    title: "Alarm Status",
    alarms: [errorRateAlarm],
    width: 12,
  }),
);
```

Keep dashboards focused. A dashboard with 20 widgets is less useful than one with 4-6 that cover the metrics you actually look at during an incident. The standard starting set for Lambda: invocations, errors (or error rate), duration percentiles, and throttles.

## The Takeaway

Lambda visibility requires deliberate setup, but the setup is straightforward once you know the pieces. Structured JSON logging makes your logs queryable in Logs Insights. The built-in CloudWatch metrics cover the operational basics without any instrumentation. Alarms on error rate keep you from finding out about problems from users. X-Ray tracing connects the dots when a request flows through multiple services. A dashboard puts it all in one place. Start with logging and one alarm - then add metrics, tracing, and dashboards as the function matures. For a deeper look at Lambda's execution model and deployment options, see [AWS Lambda: What It Is, When to Use It, and How to Deploy It](/articles/intro-to-aws-lambda).
