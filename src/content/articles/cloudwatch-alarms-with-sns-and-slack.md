---
title: CloudWatch Alarms with SNS, Email, and Slack
date: 2026-04-22
excerpt: CloudWatch Alarms don't notify anyone on their own. Here's how to wire them to SNS for email alerts and a Lambda function for Slack notifications.
draft: false
---

A CloudWatch Alarm changing state is a signal, not a notification. By itself it changes a color in the console and that's it. To actually alert someone, you need to connect the alarm to an action - and the standard action is publishing to an **SNS topic**. From there, SNS can fan out to email, SMS, or a Lambda function that forwards the alert to Slack, PagerDuty, or anywhere else.

This article walks through the full chain: CloudWatch Alarm → SNS topic → email subscription and Slack notification via Lambda. Everything is deployed with CDK.

## The Architecture

The flow is straightforward:

1. A **CloudWatch Alarm** monitors a metric and changes state (OK → ALARM or ALARM → OK)
2. The state change triggers an **SNS topic**
3. The SNS topic fans out to one or more **subscribers**:
   - An **email address** gets a raw notification directly from SNS
   - A **Lambda function** receives the SNS payload and forwards a formatted message to a Slack Incoming Webhook

SNS is the hub. You can add as many subscribers as you need - email, SMS, Lambda, SQS, HTTP endpoints - and they all receive the same message in parallel.

## Setting Up the SNS Topic

The SNS topic is the destination for all alarm actions. Create it first since the alarm and subscribers both reference it.

```typescript
import * as cdk from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cw_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import { Construct } from "constructs";

export class AlertingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const alertTopic = new sns.Topic(this, "AlertTopic", {
      displayName: "CloudWatch Alerts",
    });
  }
}
```

`displayName` shows up in the subject line of email notifications and as the sender name for SMS. Keep it descriptive - you'll thank yourself when you have multiple topics for different services.

## Email Alerts

Adding an email subscriber is one line:

```typescript
alertTopic.addSubscription(
  new sns_subscriptions.EmailSubscription("you@example.com"),
);
```

When you run `cdk deploy`, AWS sends a confirmation email to that address. **The subscription is inactive until the recipient clicks the confirmation link.** This is required by SNS - you can't subscribe an email address without consent.

What the email looks like when an alarm fires:

```
Subject: ALARM: "Lambda Error Rate" in US East (N. Virginia)

You are receiving this email because your Amazon CloudWatch Alarm "Lambda Error Rate"
in the US East (N. Virginia) region has entered the ALARM state...

Alarm Name: Lambda Error Rate
Alarm Description: Error rate exceeded 5% over 2 evaluation periods
AWS Account: 123456789012
Region: US East (N. Virginia)
State Change: OK -> ALARM
Reason for State Change: Threshold Crossed: 2 out of the last 2 datapoints
  [8.3 (21/04/26 14:23:00), 6.1 (21/04/26 14:18:00)] were greater than
  the threshold (5.0).
```

The raw SNS email is functional but not pretty. For teams that want formatted, actionable alerts in a shared channel, Slack is a better target.

## Wiring an Alarm to SNS

Create an alarm and attach SNS actions for both state transitions:

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";

// Reference your existing Lambda function
const fn = lambda.Function.fromFunctionName(this, "AppFunction", "my-function");

// Error rate alarm using metric math
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
  threshold: 5,
  evaluationPeriods: 2,
  comparisonOperator:
    cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmName: "Lambda Error Rate",
  alarmDescription: "Error rate exceeded 5% over 2 evaluation periods",
});

// Notify on both ALARM and OK (recovery)
errorRateAlarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));
errorRateAlarm.addOkAction(new cw_actions.SnsAction(alertTopic));
```

`addAlarmAction` fires when the alarm enters ALARM state. `addOkAction` fires when it recovers to OK. Adding both means you get notified when a problem starts and when it resolves - without having to watch the console.

## Slack Alerts

Getting alerts into Slack requires three things:

1. A Slack Incoming Webhook URL
2. A Lambda function that receives the SNS payload and POSTs to the webhook
3. An SNS subscription pointing at that Lambda function

### Creating a Slack Incoming Webhook

In Slack: **Apps → Incoming Webhooks → Add to Slack → choose a channel → copy the webhook URL**.

The URL looks like `https://hooks.slack.com/services/T.../B.../...`. Treat it like a secret - anyone with the URL can post to your channel. Store it in SSM Parameter Store:

```bash
aws ssm put-parameter \
  --name "/alerts/slack-webhook-url" \
  --value "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  --type SecureString
```

### The Lambda Forwarder

The forwarder function receives the SNS event, extracts the alarm details, and POSTs a formatted message to Slack. No third-party dependencies - just Python stdlib:

```python
# slack_forwarder/handler.py
import json
import os
import urllib.request
import urllib.error


SLACK_WEBHOOK_URL = os.environ["SLACK_WEBHOOK_URL"]


def lambda_handler(event, context):
    record = event["Records"][0]["Sns"]
    message = json.loads(record["Message"])

    alarm_name = message.get("AlarmName", "Unknown Alarm")
    new_state = message.get("NewStateValue", "UNKNOWN")
    old_state = message.get("OldStateValue", "UNKNOWN")
    reason = message.get("NewStateReason", "")
    region = message.get("AWSAccountId", "")
    account_id = message.get("AWSAccountId", "")

    # Color: red for ALARM, green for OK, gray for anything else
    color_map = {"ALARM": "#e01e5a", "OK": "#2eb67d", "INSUFFICIENT_DATA": "#ecb22e"}
    color = color_map.get(new_state, "#aaaaaa")

    console_url = (
        f"https://console.aws.amazon.com/cloudwatch/home"
        f"?region={message.get('Region', 'us-east-1')}"
        f"#alarmsV2:alarm/{urllib.request.quote(alarm_name)}"
    )

    payload = {
        "attachments": [
            {
                "color": color,
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*CloudWatch Alarm: {alarm_name}*\n{old_state} → *{new_state}*",
                        },
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": reason},
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {"type": "plain_text", "text": "View in CloudWatch"},
                                "url": console_url,
                            }
                        ],
                    },
                ],
            }
        ]
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        SLACK_WEBHOOK_URL,
        data=data,
        headers={"Content-Type": "application/json"},
    )

    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        print(json.dumps({"level": "error", "event": "slack_post_failed", "status": e.code, "body": e.read().decode()}))
        raise
```

The message uses Slack's Block Kit format with a colored sidebar, the state transition, the CloudWatch reason string, and a button linking directly to the alarm in the console.

### Deploying the Forwarder with CDK

Read the webhook URL from SSM at deploy time and inject it as an environment variable:

```typescript
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";

// Read the webhook URL from SSM (resolved at deploy time)
const slackWebhookUrl = ssm.StringParameter.valueForStringParameter(
  this,
  "/alerts/slack-webhook-url",
);

const slackForwarder = new lambda.Function(this, "SlackForwarder", {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: "handler.lambda_handler",
  code: lambda.Code.fromAsset(path.join(__dirname, "../../slack_forwarder")),
  environment: {
    SLACK_WEBHOOK_URL: slackWebhookUrl,
  },
  timeout: cdk.Duration.seconds(10),
  logRetention: logs.RetentionDays.ONE_WEEK,
  description: "Forwards CloudWatch alarm notifications to Slack",
});

// Subscribe the forwarder to the alert topic
alertTopic.addSubscription(
  new sns_subscriptions.LambdaSubscription(slackForwarder),
);
```

SNS needs permission to invoke the Lambda function. CDK's `LambdaSubscription` handles this automatically - it adds the required `lambda:InvokeFunction` resource policy to the function.

## What the Slack Message Looks Like

When the alarm fires, the Slack message shows:

- A colored sidebar (red for ALARM, green for OK)
- The alarm name and state transition (`OK → ALARM`)
- The CloudWatch reason string explaining why the threshold was crossed
- A "View in CloudWatch" button linking directly to the alarm

When the alarm recovers, the same function fires again with `new_state = "OK"` and a green sidebar - so the team knows the issue is resolved without checking the console.

## Putting It All Together

The complete CDK stack wires everything together:

```typescript
export class AlertingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS topic - the hub for all alert actions
    const alertTopic = new sns.Topic(this, "AlertTopic", {
      displayName: "CloudWatch Alerts",
    });

    // Email subscriber
    alertTopic.addSubscription(
      new sns_subscriptions.EmailSubscription("you@example.com"),
    );

    // Slack forwarder Lambda
    const slackWebhookUrl = ssm.StringParameter.valueForStringParameter(
      this,
      "/alerts/slack-webhook-url",
    );

    const slackForwarder = new lambda.Function(this, "SlackForwarder", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../slack_forwarder"),
      ),
      environment: { SLACK_WEBHOOK_URL: slackWebhookUrl },
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: "Forwards CloudWatch alarm notifications to Slack",
    });

    alertTopic.addSubscription(
      new sns_subscriptions.LambdaSubscription(slackForwarder),
    );

    // Alarm - reference your application's Lambda function
    const appFn = lambda.Function.fromFunctionName(
      this,
      "AppFunction",
      "my-function",
    );

    const invocations = appFn.metricInvocations({
      period: cdk.Duration.minutes(5),
    });
    const errors = appFn.metricErrors({ period: cdk.Duration.minutes(5) });

    const errorRate = new cloudwatch.MathExpression({
      expression: "errors / invocations * 100",
      usingMetrics: { errors, invocations },
      period: cdk.Duration.minutes(5),
      label: "Error Rate (%)",
    });

    const errorRateAlarm = new cloudwatch.Alarm(this, "ErrorRateAlarm", {
      metric: errorRate,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmName: "Lambda Error Rate",
      alarmDescription: "Error rate exceeded 5% over 2 evaluation periods",
    });

    errorRateAlarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));
    errorRateAlarm.addOkAction(new cw_actions.SnsAction(alertTopic));
  }
}
```

One `cdk deploy` creates the topic, the forwarder function, the email subscription, the Lambda subscription, and the alarm - all wired together.

## The Takeaway

CloudWatch Alarms + SNS is the standard AWS alerting pattern, and it's more flexible than it looks. Email subscriptions are zero-effort for individuals. The SNS → Lambda → Slack path adds one small function but gives you properly formatted, actionable alerts in a shared channel. Both can coexist on the same topic - the same alarm state change notifies both simultaneously. For more on what metrics and alarms to set up for Lambda functions specifically, see [Monitoring and Observability on AWS](/articles/monitoring-and-observability-on-aws).
