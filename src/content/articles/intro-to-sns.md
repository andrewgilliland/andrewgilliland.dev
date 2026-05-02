---
title: Intro to Amazon SNS
date: 2026-04-23
excerpt: SNS is AWS's pub/sub messaging service. One message in, many subscribers notified. Here's what it is, when to use it, and how to implement the common patterns.
draft: false
tags: ["aws", "serverless"]
---

Amazon Simple Notification Service (SNS) is a fully managed pub/sub messaging service. A **publisher** sends a message to a **topic**, and SNS delivers that message to every **subscriber** simultaneously. The publisher doesn't know or care who the subscribers are. The subscribers don't know or care who published. SNS is the hub in between.

This model shows up everywhere in AWS architectures: routing CloudWatch alarm state changes to email and Slack, fanning out an order event to multiple downstream services, triggering Lambda functions from external HTTP sources. SNS handles the delivery; you define what subscribes and what gets filtered out.

## What Is Amazon SNS?

SNS is a **push-based** messaging service. When a message arrives at a topic, SNS immediately pushes it to all subscribers - no polling, no queue to drain. Subscribers receive the message within milliseconds of it being published.

A few fundamentals:

- **Topics** are named channels. Publishers send to a topic; subscribers receive from a topic. A topic can have many publishers and many subscribers simultaneously.
- **Messages** are plain text payloads, up to 256 KB. JSON is the standard format for structured data.
- **Delivery is at-least-once.** SNS may deliver a message more than once in rare failure scenarios. Subscribers should be idempotent if that matters.
- **No persistence.** SNS does not store messages. If a subscriber is unavailable when a message is published, that delivery attempt fails. Unlike SQS, there's no queue holding messages until the subscriber is ready - unless you subscribe an SQS queue to the topic specifically to get that behavior.

## SNS vs SQS

SNS and SQS are often confused because they both deal with messages, and they're frequently used together. The distinction is simple:

|                      | SNS                                       | SQS                                |
| -------------------- | ----------------------------------------- | ---------------------------------- |
| **Model**            | Pub/sub - push to all subscribers         | Queue - pull by one consumer       |
| **Delivery**         | Immediate push, no persistence            | Stored until consumed              |
| **Consumers**        | Many subscribers, all receive the message | One consumer per message           |
| **Use when**         | Fan-out, notifications, event broadcast   | Decoupling, buffering, work queues |
| **Polling required** | No                                        | Yes                                |

The common pattern is **both together**: SNS fans out to multiple SQS queues, and each queue has a consumer that processes messages at its own pace. This gives you the broadcast capability of SNS with the durability and backpressure handling of SQS.

## Subscription Protocols

SNS can deliver messages to six types of subscribers:

| Protocol        | Use case                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| **SQS**         | Fan-out to durable queues; downstream consumers process at their own rate |
| **Lambda**      | Event-driven processing; SNS invokes the function directly                |
| **Email**       | Human notifications; subscriber must confirm via link                     |
| **SMS**         | Text message alerts; charged per message                                  |
| **HTTP/HTTPS**  | Webhook delivery to any endpoint                                          |
| **Mobile push** | Push notifications via APNs, FCM, ADM                                     |

You can mix protocols on the same topic - the same message can simultaneously email an on-call engineer, invoke a Lambda function, and enqueue in an SQS queue.

## Publishing Messages

### From Python with boto3

Publishing to an SNS topic from Python is a single `publish()` call:

```python
import boto3
import json

sns = boto3.client("sns", region_name="us-east-1")

TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:my-topic"


def publish_order_event(order_id: str, total: float, customer_id: str) -> None:
    message = json.dumps({
        "order_id": order_id,
        "total": total,
        "customer_id": customer_id,
    })

    sns.publish(
        TopicArn=TOPIC_ARN,
        Message=message,
        Subject="OrderPlaced",           # shown in email subjects
        MessageAttributes={
            "event_type": {
                "DataType": "String",
                "StringValue": "OrderPlaced",
            },
            "total": {
                "DataType": "Number",
                "StringValue": str(total),
            },
        },
    )
```

**`MessageAttributes`** are key-value pairs attached to the message but separate from the body. They're used for **message filtering** - subscribers can filter on attributes without parsing the message body. Always use them for any field you might want to filter on.

### From a Lambda Function

The pattern is the same - boto3 `publish()` - but initialize the SNS client outside the handler so it's reused across warm invocations:

```python
import boto3
import json
import os

sns = boto3.client("sns")
TOPIC_ARN = os.environ["TOPIC_ARN"]


def lambda_handler(event, context):
    order = event["order"]

    sns.publish(
        TopicArn=TOPIC_ARN,
        Message=json.dumps(order),
        MessageAttributes={
            "event_type": {
                "DataType": "String",
                "StringValue": "OrderPlaced",
            },
        },
    )

    return {"statusCode": 200}
```

Inject the topic ARN as an environment variable via CDK - hardcoding ARNs in Lambda code is fragile and breaks across environments.

## Common Patterns

### Fan-Out: SNS → Multiple SQS Queues

The most reliable high-volume pattern. A single SNS topic fans out to multiple SQS queues. Each queue has its own consumer that processes messages independently, at its own pace, with its own retry and DLQ configuration.

```
OrderPlaced event
        │
    SNS Topic
   ┌────┴────┐
SQS Queue  SQS Queue
(Billing)  (Inventory)
```

Why SQS instead of Lambda directly? SQS absorbs traffic spikes - if the inventory service is slow, messages queue up rather than failing. Each service scales and retries independently. Lambda concurrency limits don't become a bottleneck.

In CDK:

```typescript
import * as cdk from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export class OrderEventsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const orderTopic = new sns.Topic(this, "OrderTopic", {
      displayName: "Order Events",
    });

    const billingQueue = new sqs.Queue(this, "BillingQueue", {
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: new sqs.Queue(this, "BillingDLQ"),
        maxReceiveCount: 3,
      },
    });

    const inventoryQueue = new sqs.Queue(this, "InventoryQueue", {
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: new sqs.Queue(this, "InventoryDLQ"),
        maxReceiveCount: 3,
      },
    });

    orderTopic.addSubscription(
      new sns_subscriptions.SqsSubscription(billingQueue),
    );
    orderTopic.addSubscription(
      new sns_subscriptions.SqsSubscription(inventoryQueue),
    );
  }
}
```

> **Note:** By default, `SqsSubscription` wraps the SNS message in an envelope (with `TopicArn`, `MessageId`, `Timestamp`, and the original message as a string inside `Message`). Pass `rawMessageDelivery: true` to have SNS deliver the message body directly, without the envelope. Most queue consumers are easier to write with raw delivery enabled.

```typescript
orderTopic.addSubscription(
  new sns_subscriptions.SqsSubscription(billingQueue, {
    rawMessageDelivery: true,
  }),
);
```

### SNS → Lambda

SNS can invoke a Lambda function directly. The function receives the SNS event, processes it, and returns. No queue involved - SNS calls Lambda and Lambda runs.

```python
# handler.py
import json


def lambda_handler(event, context):
    for record in event["Records"]:
        message = json.loads(record["Sns"]["Message"])
        print(f"Processing: {message}")
        # do something with the message
```

The SNS event wraps each message in a `Records` list with SNS metadata:

```json
{
  "Records": [
    {
      "Sns": {
        "TopicArn": "arn:aws:sns:us-east-1:123456789012:my-topic",
        "MessageId": "...",
        "Message": "{\"order_id\": \"12345\", \"total\": 59.99}",
        "MessageAttributes": {
          "event_type": { "Type": "String", "Value": "OrderPlaced" }
        },
        "Timestamp": "2026-04-21T12:00:00.000Z"
      }
    }
  ]
}
```

In CDK:

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";

const processorFn = new lambda.Function(this, "OrderProcessor", {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: "handler.lambda_handler",
  code: lambda.Code.fromAsset("src/order_processor"),
});

orderTopic.addSubscription(
  new sns_subscriptions.LambdaSubscription(processorFn),
);
```

CDK's `LambdaSubscription` automatically grants SNS the `lambda:InvokeFunction` permission on the function.

**When SNS → Lambda vs SNS → SQS → Lambda:** Use SNS → Lambda for low-to-moderate volume event processing where you're comfortable with SNS's at-most-once retry behavior (SNS retries failed Lambda invocations up to 3 times with backoff, then drops the message). Use SNS → SQS → Lambda when you need guaranteed delivery, longer retry windows, dead-letter queues, or need to handle traffic bursts gracefully.

### Email and SMS Notifications

Email and SMS subscriptions are the simplest use case - human-readable notifications sent directly to a person or team.

```typescript
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

// Email
alertTopic.addSubscription(
  new sns_subscriptions.EmailSubscription("oncall@example.com"),
);

// SMS
alertTopic.addSubscription(
  new sns_subscriptions.SmsSubscription("+15555550100"),
);
```

**Email subscriptions require confirmation.** When `cdk deploy` runs, AWS sends a confirmation email to the address. The subscription is inactive until the recipient clicks the link. If you're deploying to a new environment and alerts aren't working, this is usually why.

SMS subscriptions are active immediately. SMS messages are limited to 140 bytes by the GSM standard - SNS handles splitting longer messages into multiple segments, but each segment is billed separately.

For structured, actionable alerts in a shared channel, SNS → Lambda → Slack is the better pattern. See [CloudWatch Alarms with SNS, Email, and Slack](/articles/cloudwatch-alarms-with-sns-and-slack) for a full implementation.

## Message Filtering

By default, every subscriber to a topic receives every message. Message filtering lets you scope a subscription so a subscriber only receives messages that match a filter policy.

Filter policies evaluate **message attributes** - they can't inspect the message body. This is why publishing with `MessageAttributes` matters.

A subscription filter policy is a JSON object where each key is an attribute name and the value is a list of acceptable values:

```json
{
  "event_type": ["OrderPlaced", "OrderUpdated"],
  "total": [{ "numeric": [">=", 50] }]
}
```

This subscriber would only receive messages where `event_type` is `OrderPlaced` or `OrderUpdated` AND `total` is 50 or greater.

In CDK, attach a filter policy to a subscription:

```typescript
import * as sns from "aws-cdk-lib/aws-sns";

// Only the billing queue receives high-value orders
orderTopic.addSubscription(
  new sns_subscriptions.SqsSubscription(premiumQueue, {
    rawMessageDelivery: true,
    filterPolicy: {
      event_type: sns.SubscriptionFilter.stringFilter({
        allowlist: ["OrderPlaced"],
      }),
      total: sns.SubscriptionFilter.numericFilter({
        greaterThanOrEqualTo: 500,
      }),
    },
  }),
);

// The standard queue receives everything else
orderTopic.addSubscription(
  new sns_subscriptions.SqsSubscription(standardQueue, {
    rawMessageDelivery: true,
  }),
);
```

Filtering happens at the SNS level before delivery - messages that don't match a subscriber's filter policy are never delivered to that subscriber and don't count toward that subscriber's invocation costs.

## FIFO Topics

Standard SNS topics deliver messages in roughly the order they're published, but delivery order is not guaranteed. If message ordering matters, use a **FIFO topic**.

FIFO topics guarantee:

- **Strict ordering** within a message group (messages with the same `MessageGroupId` are delivered in order)
- **Exactly-once delivery** within a 5-minute deduplication window (using a `MessageDeduplicationId`)

```typescript
const orderTopic = new sns.Topic(this, "OrderTopic", {
  fifo: true,
  contentBasedDeduplication: true, // SNS generates dedup ID from message content hash
  topicName: "order-events.fifo", // FIFO topics require the .fifo suffix
});
```

**FIFO limitations:** FIFO topics can only deliver to **SQS FIFO queues** - not Lambda, email, SMS, or HTTP subscribers. Throughput is also capped at 300 messages per second (vs. tens of thousands for standard topics). Use FIFO only when ordering is a hard requirement.

```typescript
const orderQueue = new sqs.Queue(this, "OrderQueue", {
  fifo: true,
  queueName: "order-processing.fifo",
  contentBasedDeduplication: true,
});

orderTopic.addSubscription(new sns_subscriptions.SqsSubscription(orderQueue));
```

## Full CDK Setup

A complete example wiring together a topic, fan-out queues, a Lambda subscriber, and message filtering:

```typescript
import * as cdk from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";
import { Construct } from "constructs";

export class MessagingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Topic
    const orderTopic = new sns.Topic(this, "OrderTopic", {
      displayName: "Order Events",
    });

    // Fan-out: billing queue (all orders)
    const billingQueue = new sqs.Queue(this, "BillingQueue", {
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: new sqs.Queue(this, "BillingDLQ"),
        maxReceiveCount: 3,
      },
    });

    orderTopic.addSubscription(
      new sns_subscriptions.SqsSubscription(billingQueue, {
        rawMessageDelivery: true,
      }),
    );

    // Fan-out: premium queue (high-value orders only)
    const premiumQueue = new sqs.Queue(this, "PremiumQueue", {
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    orderTopic.addSubscription(
      new sns_subscriptions.SqsSubscription(premiumQueue, {
        rawMessageDelivery: true,
        filterPolicy: {
          total: sns.SubscriptionFilter.numericFilter({
            greaterThanOrEqualTo: 500,
          }),
        },
      }),
    );

    // Lambda subscriber: real-time fraud check
    const fraudCheckFn = new lambda.Function(this, "FraudCheck", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../fraud_check")),
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    orderTopic.addSubscription(
      new sns_subscriptions.LambdaSubscription(fraudCheckFn, {
        filterPolicy: {
          event_type: sns.SubscriptionFilter.stringFilter({
            allowlist: ["OrderPlaced"],
          }),
        },
      }),
    );
  }
}
```

## The Takeaway

SNS is the broadcast layer in AWS messaging architectures. A single `publish()` call reaches every subscriber simultaneously - email inboxes, SQS queues, Lambda functions, SMS numbers - without the publisher knowing or caring who's listening. The fan-out pattern (SNS → multiple SQS queues) is the right model for high-volume event-driven work where each downstream service needs durability and independent scaling. Message filtering keeps subscriptions scoped so services only receive what's relevant to them. FIFO topics handle the rare cases where strict ordering is a hard requirement.

For using SNS specifically to route CloudWatch alarm notifications to email and Slack, see [CloudWatch Alarms with SNS, Email, and Slack](/articles/cloudwatch-alarms-with-sns-and-slack). For broader event routing with content-based rules, scheduling, and cross-account delivery, see [Amazon EventBridge](/articles/amazon-eventbridge).
