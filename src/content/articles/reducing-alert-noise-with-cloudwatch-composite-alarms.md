---
title: Reducing Alert Noise with CloudWatch Composite Alarms
date: 2026-07-05
excerpt: When your database goes down, every service that depends on it starts throwing errors. Composite alarms let you express alarm logic so you get one page per root cause, not one per symptom.
draft: false
tags: ["aws", "cdk", "cloudwatch"]
---

When your database goes down, every service that depends on it starts throwing errors. Without composite alarms, each one pages your on-call engineer separately. Fifteen minutes into the incident you have six active alarms, one root cause, and a very unhappy engineer. CloudWatch **composite alarms** solve this by letting you express alarm logic - combining, suppressing, and routing alerts based on the state of other alarms rather than raw metrics. This article covers how they work and how to build the full pattern in CDK.

## What Is a Composite Alarm?

A composite alarm derives its state from a **boolean rule expression** over other alarms. It has no metric of its own. When the rule evaluates to true, the composite alarm enters `ALARM` state and fires its configured actions. When it evaluates to false, it returns to `OK`.

The expression operators are simple:

- `ALARM("alarm-name")` — true when the named alarm is in `ALARM` state
- `OK("alarm-name")` — true when the named alarm is in `OK` state
- `AND`, `OR`, `NOT` — standard boolean logic

Composite alarms can reference metric alarms or other composite alarms. You can nest them to build multi-level alerting hierarchies.

The standard pattern is to put actions (SNS notifications, Auto Scaling policies) on the composite alarms only, and set `actionsEnabled: false` on all the underlying metric alarms. The metric alarms become pure signal sources. Only composite alarms trigger pages.

## The Noise Problems They Solve

### Dependency suppression

The highest-value use case. If your database goes down, every downstream service starts failing. Without composite alarms you get paged for each one. With composite alarms, you wire each service alarm through a `NOT ALARM("db-down")` condition:

```
ALARM("order-service-errors") AND NOT ALARM("db-connection-failures")
ALARM("payment-service-errors") AND NOT ALARM("db-connection-failures")
ALARM("inventory-service-errors") AND NOT ALARM("db-connection-failures")
```

When RDS goes down: one page for RDS, zero pages for the services. When RDS recovers and a service is still erroring: that service pages independently. **Root cause first, symptoms only when necessary.**

### Requiring corroborating evidence

A single metric spike is often a blip - a slow upstream call, a batch job, a cache miss. Requiring two conditions to be true simultaneously filters out false positives:

```
ALARM("lambda-errors") AND ALARM("lambda-duration-p99-high")
```

Errors alone might be an intermittent upstream issue. Errors _and_ elevated p99 duration together mean the function itself is struggling - worth waking someone up.

### Maintenance windows

Flip a manually-controlled alarm to `ALARM` state before a deploy. Every composite alarm that includes `NOT ALARM("maintenance-window")` goes silent automatically. No disabling individual alarms, no threshold changes, no forgotten re-enables:

```
ALARM("payment-errors") AND NOT ALARM("maintenance-window")
```

### Severity tiers

Use separate composite alarms to route low-severity issues to Slack and high-severity issues to PagerDuty, without needing a third-party routing tool:

```
# warning → Slack
ALARM("error-rate-warn")

# critical → on-call page
ALARM("error-rate-critical") AND ALARM("error-rate-sustained")
```

Wire each composite alarm to a different SNS topic. One topic has a Slack subscription. The other has a PagerDuty subscription. The metric alarms have no actions of their own.

## Writing Alarm Rules

In CDK, you build rule expressions using the `AlarmRule` class:

| CDK helper                                     | Expression equivalent   |
| ---------------------------------------------- | ----------------------- |
| `AlarmRule.allOf(a, b)`                        | `ALARM(a) AND ALARM(b)` |
| `AlarmRule.anyOf(a, b)`                        | `ALARM(a) OR ALARM(b)`  |
| `AlarmRule.not(a)`                             | `NOT ALARM(a)`          |
| `AlarmRule.fromAlarm(alarm, AlarmState.ALARM)` | `ALARM("alarm-name")`   |
| `AlarmRule.fromString("ALARM(...)")`           | Raw expression string   |

`fromAlarm` takes a second argument for the state you're matching against: `AlarmState.ALARM`, `AlarmState.OK`, or `AlarmState.INSUFFICIENT_DATA`. You'll almost always use `ALARM`.

Use `fromString` when you need to reference an alarm by name that isn't defined in the same CDK stack, or when the helpers can't express a complex nested rule cleanly.

## Building the Pattern in CDK

The example below builds monitoring for a Lambda-backed API Gateway with an RDS database. It covers the three most common needs: service alarm suppression, dependency detection, and maintenance windows.

```typescript
// lib/monitoring.ts
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

interface MonitoringProps {
  serviceName: string;
  lambdaFunction: lambda.Function;
  alertTopic: sns.Topic;
}

export class ServiceMonitoring extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    const { serviceName, lambdaFunction, alertTopic } = props;

    // --- child metric alarms (no actions - pure signal sources) ---

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, "LambdaErrors", {
      metric: lambdaFunction.metricErrors({
        statistic: "Sum",
        period: Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmName: `${serviceName}-lambda-errors`,
      actionsEnabled: false,
    });

    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, "LambdaThrottles", {
      metric: lambdaFunction.metricThrottles({
        statistic: "Sum",
        period: Duration.minutes(1),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmName: `${serviceName}-lambda-throttles`,
      actionsEnabled: false,
    });

    const dbConnectionAlarm = new cloudwatch.Alarm(
      this,
      "DatabaseConnections",
      {
        metric: new cloudwatch.Metric({
          namespace: "AWS/RDS",
          metricName: "DatabaseConnections",
          statistic: "Average",
          period: Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        alarmName: `${serviceName}-db-connections-low`,
        actionsEnabled: false,
      },
    );

    // Maintenance window alarm - never fires naturally, flipped manually via CLI.
    // Missing data is treated as NOT_BREACHING so it stays in OK by default.
    const maintenanceAlarm = new cloudwatch.Alarm(this, "MaintenanceWindow", {
      metric: new cloudwatch.Metric({
        namespace: "Custom/Maintenance",
        metricName: "WindowActive",
        statistic: "Sum",
        period: Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmName: `${serviceName}-maintenance-window`,
      actionsEnabled: false,
    });

    // --- composite alarms (actions live here) ---

    // Database alarm fires on its own - it IS the root cause.
    // Suppressed during maintenance windows only.
    const dbDegraded = new cloudwatch.CompositeAlarm(this, "DatabaseDegraded", {
      compositeAlarmName: `${serviceName}-database-degraded`,
      alarmRule: cloudwatch.AlarmRule.allOf(
        cloudwatch.AlarmRule.fromAlarm(
          dbConnectionAlarm,
          cloudwatch.AlarmState.ALARM,
        ),
        cloudwatch.AlarmRule.not(
          cloudwatch.AlarmRule.fromAlarm(
            maintenanceAlarm,
            cloudwatch.AlarmState.ALARM,
          ),
        ),
      ),
    });

    dbDegraded.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));
    dbDegraded.addOkAction(new cloudwatch_actions.SnsAction(alertTopic));

    // API alarm fires only when the database is healthy.
    // If the DB is down, that alarm fires instead - not this one.
    const apiDegraded = new cloudwatch.CompositeAlarm(this, "ApiDegraded", {
      compositeAlarmName: `${serviceName}-api-degraded`,
      alarmRule: cloudwatch.AlarmRule.allOf(
        cloudwatch.AlarmRule.anyOf(
          cloudwatch.AlarmRule.fromAlarm(
            lambdaErrorAlarm,
            cloudwatch.AlarmState.ALARM,
          ),
          cloudwatch.AlarmRule.fromAlarm(
            lambdaThrottleAlarm,
            cloudwatch.AlarmState.ALARM,
          ),
        ),
        cloudwatch.AlarmRule.not(
          cloudwatch.AlarmRule.fromAlarm(
            dbConnectionAlarm,
            cloudwatch.AlarmState.ALARM,
          ),
        ),
        cloudwatch.AlarmRule.not(
          cloudwatch.AlarmRule.fromAlarm(
            maintenanceAlarm,
            cloudwatch.AlarmState.ALARM,
          ),
        ),
      ),
    });

    apiDegraded.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));
    apiDegraded.addOkAction(new cloudwatch_actions.SnsAction(alertTopic));
  }
}
```

Using the construct in a stack:

```typescript
// lib/my-service-stack.ts
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { ServiceMonitoring } from "./monitoring";

const alertTopic = new sns.Topic(this, "AlertTopic");

alertTopic.addSubscription(
  new sns_subscriptions.EmailSubscription("on-call@example.com"),
);

new ServiceMonitoring(this, "Monitoring", {
  serviceName: "payment-api",
  lambdaFunction: myLambda,
  alertTopic,
});
```

`addOkAction` sends a recovery notification when the composite alarm returns to `OK` - useful so on-call knows the incident is resolved without checking the console.

## Flipping the Maintenance Window

Before a deploy, set the maintenance alarm to `ALARM` manually:

```bash
aws cloudwatch set-alarm-state \
  --alarm-name payment-api-maintenance-window \
  --state-value ALARM \
  --state-reason "deploying v2.4.1"
```

After the deploy succeeds, restore it:

```bash
aws cloudwatch set-alarm-state \
  --alarm-name payment-api-maintenance-window \
  --state-value OK \
  --state-reason "deploy complete"
```

Wire these into your CI/CD pipeline as pre- and post-deploy steps and you get automatic maintenance windows with no manual intervention. The composite alarms that reference `NOT ALARM("...-maintenance-window")` go silent for the duration and resume automatically.

For fully automated time-based windows (e.g., silencing during a nightly batch job), an EventBridge Scheduler rule can call `set-alarm-state` on a cron schedule instead of relying on a pipeline step.

## The Takeaway

- **Put actions on composite alarms, not metric alarms.** Set `actionsEnabled: false` on all child metric alarms. They're signal sources, not notification triggers.
- **Dependency suppression is the highest-ROI use case.** Wire downstream service alarms through `NOT ALARM("dependency-alarm")` to get one page per root cause instead of one per affected service.
- **AND two metrics to filter blips.** A single metric spike is often noise. Two correlated metrics crossing thresholds simultaneously is a real problem.
- **The maintenance window pattern is one alarm, not a process.** A manually-flipped alarm with `treatMissingData: NOT_BREACHING` is all you need. Silence everything with one CLI command before a deploy.
- **`addOkAction` closes the loop.** Send a recovery notification when composite alarms return to OK so on-call knows the incident is resolved without checking the console.
- **Composite alarms compose.** You can nest composite alarms to build severity tiers, regional rollups, or service dependency trees using the same primitives.
