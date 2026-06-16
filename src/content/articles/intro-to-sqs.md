---
title: Intro to Amazon SQS
date: 2026-06-15
excerpt: SQS is AWS's managed message queue service. Messages go in, consumers pull them out, and the queue handles everything in between. Here's what it is, when to use it, and how to implement the common patterns.
draft: false
tags: ["aws", "serverless"]
---

Amazon Simple Queue Service (SQS) is a fully managed message queue service. A **producer** sends a message to a **queue**, where it sits until a **consumer** polls for it, processes it, and deletes it. The producer doesn't wait for the consumer to be ready. The consumer doesn't need to be running when the message arrives. The queue is the buffer between them.

This decoupling shows up everywhere: a web API that enqueues a job rather than processing it inline, a Lambda function that drains a queue of incoming events, a pipeline that absorbs traffic spikes so a downstream service doesn't get overwhelmed. SQS handles the storage and delivery; you define who produces and who consumes.

## What Is Amazon SQS?

SQS is a **pull-based** messaging service. Consumers poll the queue and retrieve messages in batches. SQS does not push, it waits. Messages are stored durably until a consumer successfully processes and deletes them.

A few fundamentals:

- **Queues** are named channels. Producers send messages to a queue; consumers receive from a queue. A queue can have many producers and many consumers simultaneously.
- **Messages** are plain text payloads, up to 256 KB. JSON is the standard format for structured data.
- **Delivery is at-least-once.** SQS may deliver a message more than once in rare scenarios. Consumers should be idempotent, processing the same message twice should produce the same result as processing it once.
- **Messages are deleted by the consumer.** SQS doesn't automatically remove a message after delivery. The consumer must explicitly delete it after successful processing. If the consumer fails, the message becomes visible again after the **visibility timeout** expires.

## Standard vs FIFO Queues

SQS offers two queue types:

|                 | Standard                              | FIFO                                       |
| --------------- | ------------------------------------- | ------------------------------------------ |
| **Throughput**  | Unlimited (nearly)                    | Up to 3,000 msg/sec with batching          |
| **Ordering**    | Best-effort (not guaranteed)          | Strict first-in, first-out                 |
| **Delivery**    | At-least-once (duplicates possible)   | Exactly-once processing                    |
| **Use when**    | High throughput, order doesn't matter | Order matters, duplicates are unacceptable |
| **Name suffix** | None required                         | Must end in `.fifo`                        |

Use **Standard** queues by default, they're cheaper and scale without limit. Reach for **FIFO** only when you genuinely need ordered, deduplicated processing, such as financial transactions or state machine events where out-of-order processing would corrupt state.

## Key Concepts

### Visibility Timeout

When a consumer receives a message, SQS hides it from other consumers for the **visibility timeout** period (default 30 seconds). The consumer has that window to process and delete the message. If it doesn't delete it in time, because it crashed, timed out, or threw an exception - the message becomes visible again and another consumer can pick it up.

Set the visibility timeout to **at least 6× your average processing time**. If your Lambda function averages 10 seconds, set visibility timeout to at least 60 seconds. If processing regularly approaches the timeout, extend it programmatically with `change_message_visibility`.

### Dead-Letter Queue (DLQ)

A DLQ is a separate queue that receives messages which repeatedly fail processing. Configure `maxReceiveCount`, the number of times a message can be received before it's moved to the DLQ. Messages in the DLQ sit there indefinitely (up to the configured retention period) so you can inspect what failed and why.

Always configure a DLQ. Without one, a poison pill message - one your code can never successfully process, will loop forever, blocking throughput and wasting compute.

### Long Polling

By default, `receive_message()` returns immediately even if the queue is empty, this is **short polling**. **Long polling** holds the connection open for up to 20 seconds, returning as soon as a message arrives or the timeout expires. Long polling:

- Reduces empty responses (and the API calls that cost money)
- Reduces CPU on the consumer side
- Has lower latency when messages arrive intermittently

Always use long polling. Set `WaitTimeSeconds=20` on every `receive_message()` call, or set `ReceiveMessageWaitTimeSeconds=20` on the queue itself.

### Message Retention

Messages that aren't consumed are retained for **4 days by default**, configurable from 1 minute to 14 days. Set a retention period long enough to survive a consumer outage. 7–14 days is a reasonable default for production queues.

## Working with SQS in Python

### Sending a Message

```python
import boto3
import json

sqs = boto3.client("sqs", region_name="us-east-1")

QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue"


def enqueue_order(order_id: str, total: float, customer_id: str) -> None:
    message = json.dumps({
        "order_id": order_id,
        "total": total,
        "customer_id": customer_id,
    })

    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=message,
        MessageAttributes={
            "event_type": {
                "DataType": "String",
                "StringValue": "OrderPlaced",
            },
        },
    )
```

### Receiving and Deleting Messages

```python
import boto3
import json

sqs = boto3.client("sqs", region_name="us-east-1")

QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue"


def process_messages() -> None:
    response = sqs.receive_message(
        QueueUrl=QUEUE_URL,
        MaxNumberOfMessages=10,      # 1–10
        WaitTimeSeconds=20,          # long polling
        VisibilityTimeout=60,
        MessageAttributeNames=["All"],
    )

    messages = response.get("Messages", [])

    for message in messages:
        body = json.loads(message["Body"])

        try:
            handle_order(body)

            # Delete only after successful processing
            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=message["ReceiptHandle"],
            )
        except Exception as e:
            print(f"Failed to process message: {e}")
            # Don't delete - let the visibility timeout expire
            # so the message becomes visible again
```

Never delete a message before you've finished processing it. If your code raises after the delete, you've lost the message.

### Sending Batches

`send_message_batch` sends up to 10 messages in a single API call. Use it whenever you're enqueuing multiple messages at once, it's cheaper and faster than sending individually.

```python
def enqueue_batch(orders: list[dict]) -> None:
    entries = [
        {
            "Id": str(i),
            "MessageBody": json.dumps(order),
        }
        for i, order in enumerate(orders[:10])
    ]

    response = sqs.send_message_batch(
        QueueUrl=QUEUE_URL,
        Entries=entries,
    )

    if response.get("Failed"):
        for failure in response["Failed"]:
            print(f"Failed to enqueue message {failure['Id']}: {failure['Message']}")
```

## Lambda as a Consumer

The most common SQS pattern on AWS: SQS as an event source that invokes a Lambda function in batches. Lambda polls the queue on your behalf - you don't write any polling code.

```python
import json


def lambda_handler(event, context):
    for record in event["Records"]:
        body = json.loads(record["body"])
        process_order(body)

    # Returning normally deletes all records in the batch
    # Raise an exception to return the entire batch to the queue


def process_order(order: dict) -> None:
    print(f"Processing order {order['order_id']}")
```

### Partial Batch Failures

By default, if any record in the batch raises an exception, the entire batch returns to the queue, including the records that succeeded. This leads to duplicate processing of successful records.

Enable **partial batch failure reporting** by returning a `batchItemFailures` list with just the message IDs that failed. Lambda will re-enqueue only those messages.

```python
def lambda_handler(event, context):
    failures = []

    for record in event["Records"]:
        try:
            body = json.loads(record["body"])
            process_order(body)
        except Exception as e:
            print(f"Failed to process {record['messageId']}: {e}")
            failures.append({"itemIdentifier": record["messageId"]})

    return {"batchItemFailures": failures}
```

You also need to enable `ReportBatchItemFailures` on the event source mapping - CDK handles this with `reportBatchItemFailures: true`.

## Common Patterns

### Decoupling an API from Background Work

The most basic SQS pattern: an API endpoint enqueues work and returns immediately, rather than doing the work inline and making the client wait.

```
POST /orders
      │
  API Handler ──► SQS Queue ──► Lambda Consumer
      │                              │
  200 OK                     processes order,
(immediate)                  sends confirmation email,
                             updates inventory
```

The API call is fast and reliable. The background processing scales independently and can retry on failure without affecting the client.

### Fan-Out: SNS → Multiple SQS Queues

A single SNS topic fans out to multiple SQS queues. Each queue has its own consumer that processes messages independently, at its own pace, with its own retry and DLQ configuration.

```
OrderPlaced event
        │
    SNS Topic
   ┌────┴────┐
SQS Queue  SQS Queue
(Billing)  (Inventory)
```

This is the backbone of event-driven microservice architectures on AWS. See [Intro to Amazon SNS](/articles/intro-to-sns) for the SNS side of this pattern.

## Deploying with CDK

```typescript
import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_event_sources from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";

export class OrderProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dlq = new sqs.Queue(this, "OrderDLQ", {
      retentionPeriod: cdk.Duration.days(14),
    });

    const queue = new sqs.Queue(this, "OrderQueue", {
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      receiveMessageWaitTime: cdk.Duration.seconds(20), // long polling
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    const processor = new lambda.Function(this, "OrderProcessor", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      timeout: cdk.Duration.seconds(30),
    });

    processor.addEventSource(
      new lambda_event_sources.SqsEventSource(queue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      }),
    );
  }
}
```

A few CDK-specific notes:

- `visibilityTimeout` on the queue must be **≥ the Lambda function timeout**. CDK will warn you if it isn't.
- `maxBatchingWindow` buffers messages for up to 5 seconds to fill larger batches. Use it when throughput matters more than latency.
- CDK automatically grants the Lambda function `sqs:ReceiveMessage`, `sqs:DeleteMessage`, and `sqs:GetQueueAttributes` on the queue.

## When Not to Use SQS

SQS is the right default for async work queues, but there are cases where something else fits better:

- **You need pub/sub fan-out** - use SNS (optionally with SQS subscribers)
- **You need real-time streaming with replay** - use Kinesis Data Streams
- **You need complex event routing and scheduling** - use EventBridge
- **Messages exceed 256 KB** - store the payload in S3, put the S3 key in the SQS message
- **You need sub-millisecond messaging between services** - SQS is not a low-latency bus; use in-process calls or a service mesh

SQS is the right tool when you need durable, reliable, decoupled async processing. When those are your requirements, it's hard to beat.
