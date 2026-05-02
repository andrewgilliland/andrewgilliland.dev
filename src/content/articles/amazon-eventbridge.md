---
title: Amazon EventBridge - Event-Driven Architecture on AWS
date: 2026-03-24
excerpt: EventBridge is a serverless event bus that connects your applications with data from AWS services, SaaS apps, and custom sources. Learn what it is, the problems it solves, and how to implement it with CDK.
draft: false
tags: ["aws", "serverless"]
---

## What is Amazon EventBridge?

Amazon EventBridge is a serverless event bus service that makes it easy to route events between AWS services, third-party SaaS applications, and your own custom applications. Think of it as a central nervous system for your cloud architecture, events flow in, rules evaluate them, and targets react.

An **event** is a JSON object representing a change in state. When a user signs up, an order is placed, or an EC2 instance changes state, that's an event. EventBridge receives these events and routes them to the right targets based on rules you define.

```json
{
  "source": "com.myapp.orders",
  "detail-type": "OrderPlaced",
  "detail": {
    "orderId": "12345",
    "customerId": "abc-789",
    "total": 59.99
  }
}
```

## What Problems Does It Solve?

### Tight Coupling

Without an event bus, services call each other directly. Service A calls Service B, which calls Service C. When Service B goes down, everything falls apart. EventBridge decouples producers from consumers, the order service doesn't need to know that the email service, analytics pipeline, and inventory system all care about new orders.

### Fan-Out Complexity

Need to notify five different services when something happens? Without EventBridge, you'd wire up five API calls or manage an SNS topic with SQS queues. EventBridge lets you define rules that route a single event to multiple targets with no extra plumbing.

### Filtering and Routing

Not every consumer cares about every event. EventBridge supports content-based filtering so you can write rules like "only trigger this Lambda when the order total is over $100" or "only process events from the payments source."

```json
{
  "source": ["com.myapp.orders"],
  "detail": {
    "total": [{ "numeric": [">", 100] }]
  }
}
```

### Scheduling

EventBridge Scheduler lets you create one-time or recurring schedules that trigger targets. No more CloudWatch Events cron workarounds, you get a purpose-built scheduler with at-least-once delivery and built-in retry policies.

### Cross-Account and Cross-Region

EventBridge natively supports sending events across AWS accounts and regions. This is invaluable for organizations with multi-account architectures where a shared event bus acts as the integration layer.

## AWS Services That Work Well with EventBridge

EventBridge integrates with over 20 AWS services as event sources and over 20 as targets. Here are the most useful pairings:

### As Event Sources

- **S3** - receive events when objects are created, deleted, or modified
- **Step Functions** - emit events on state machine status changes
- **CodePipeline / CodeBuild** - trigger workflows on deployment events
- **EC2** - react to instance state changes (running, stopped, terminated)
- **ECS** - respond to task and service state changes
- **CloudTrail** - capture any AWS API call as an event

### As Targets

- **Lambda** - the most common target; run a function in response to an event
- **Step Functions** - kick off a complex workflow from a single event
- **SQS** - buffer events for downstream consumers
- **SNS** - fan out notifications via email, SMS, or HTTP
- **API Gateway** - forward events to REST APIs
- **CloudWatch Logs** - log events for debugging and auditing
- **ECS Tasks** - launch containerized workloads on demand
- **Kinesis Data Streams** - stream events into real-time analytics pipelines

### Best Combinations

| Pattern          | Source → Target                            | Use Case                                             |
| ---------------- | ------------------------------------------ | ---------------------------------------------------- |
| Async processing | API Gateway → EventBridge → Lambda         | Decouple API responses from backend work             |
| Data pipeline    | S3 → EventBridge → Step Functions          | Process uploaded files through a multi-step workflow |
| Audit trail      | CloudTrail → EventBridge → CloudWatch Logs | Log specific API calls for compliance                |
| Scheduled jobs   | EventBridge Scheduler → Lambda             | Run nightly reports or cleanup tasks                 |
| Cross-service    | ECS → EventBridge → SNS                    | Alert on-call when a task fails                      |

## Implementing EventBridge with CDK

The AWS CDK makes it straightforward to define EventBridge resources as infrastructure as code. Here's how to set up a custom event bus, a rule, and a Lambda target.

### Install the Dependencies

```bash
npm install aws-cdk-lib constructs
```

### Define the Stack

```typescript
import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class EventBridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a custom event bus
    const ordersBus = new events.EventBus(this, "OrdersBus", {
      eventBusName: "orders-bus",
    });

    // Create the Lambda handler
    const processOrderFn = new lambda.Function(this, "ProcessOrderFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("Order event received:", JSON.stringify(event, null, 2));
          const { orderId, customerId, total } = event.detail;
          // Process the order...
          return { statusCode: 200 };
        };
      `),
    });

    // Create a rule that matches OrderPlaced events
    new events.Rule(this, "OrderPlacedRule", {
      eventBus: ordersBus,
      eventPattern: {
        source: ["com.myapp.orders"],
        detailType: ["OrderPlaced"],
      },
      targets: [new targets.LambdaFunction(processOrderFn)],
    });
  }
}
```

### Publishing Events

From your application code, publish events to the bus using the AWS SDK:

```typescript
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

const client = new EventBridgeClient({});

await client.send(
  new PutEventsCommand({
    Entries: [
      {
        EventBusName: "orders-bus",
        Source: "com.myapp.orders",
        DetailType: "OrderPlaced",
        Detail: JSON.stringify({
          orderId: "12345",
          customerId: "abc-789",
          total: 59.99,
        }),
      },
    ],
  }),
);
```

### Adding a Dead Letter Queue

In production, you want failed event deliveries to land somewhere you can inspect them. Add a DLQ to your rule target:

```typescript
import * as sqs from "aws-cdk-lib/aws-sqs";

const dlq = new sqs.Queue(this, "OrdersDLQ", {
  retentionPeriod: cdk.Duration.days(14),
});

new events.Rule(this, "OrderPlacedRule", {
  eventBus: ordersBus,
  eventPattern: {
    source: ["com.myapp.orders"],
    detailType: ["OrderPlaced"],
  },
  targets: [
    new targets.LambdaFunction(processOrderFn, {
      deadLetterQueue: dlq,
      retryAttempts: 2,
    }),
  ],
});
```

### Adding a Schedule

Use EventBridge Scheduler to run a nightly cleanup:

```typescript
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import * as scheduler_targets from "aws-cdk-lib/aws-scheduler-targets";

new scheduler.CfnSchedule(this, "NightlyCleanup", {
  scheduleExpression: "cron(0 2 * * ? *)",
  flexibleTimeWindow: { mode: "OFF" },
  target: {
    arn: processOrderFn.functionArn,
    roleArn: schedulerRole.roleArn,
  },
});
```

## Key Takeaways

- **EventBridge is the backbone of event-driven AWS architectures.** It replaces point-to-point integrations with a single, managed event bus.
- **Content-based filtering** means consumers only receive events they care about, no wasted invocations.
- **CDK makes it declarative.** A bus, a rule, and a target can be defined in under 30 lines of TypeScript.
- **Always add a DLQ** to catch failed deliveries in production.
- **Use custom event buses** for your application events. Keep the default bus for AWS service events.

EventBridge is one of those AWS services that, once you start using it, you wonder how you built anything without it. It turns a tangled web of service-to-service calls into a clean, observable, event-driven system.
