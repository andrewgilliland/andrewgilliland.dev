---
title: "Intro to Amazon ECS"
date: 2026-09-16
excerpt: ECS runs containerized applications without making you build a container orchestration platform yourself. Here is where it fits, why to use it, and how to deploy a service with Fargate and CDK.
draft: false
tags: ["aws", "ecs", "cdk"]
---

Running one container is simple. Keeping it healthy, replacing failed instances, scaling it, and routing traffic takes more infrastructure. Amazon ECS manages that orchestration while you keep packaging the application as a standard container.

## What Is Amazon ECS?

Amazon Elastic Container Service (ECS) is AWS's managed service for deploying, running, and scaling containerized applications.

A container image packages the application and its dependencies. A task definition describes how ECS should run it. A task is one running instance of that definition, and an ECS service keeps the desired number of tasks running.

ECS schedules and runs containers, but it does not build their images. Images are created separately and typically stored in Amazon Elastic Container Registry (ECR).

ECS can run tasks on EC2 instances that you provision and maintain, or on AWS Fargate, where AWS manages the underlying compute capacity. This article uses Fargate for a small HTTP API.

The resource model is:

```text
container image -> task definition -> Fargate task -> ECS service -> load balancer
```

## What We're Building

The example is a small Python HTTP service with one endpoint and one health check. The CDK stack creates:

- A VPC with public subnets for the load balancer and private subnets for tasks
- An ECS cluster running on Fargate
- A task definition with 256 CPU units and 512 MiB of memory
- An Application Load Balancer that forwards traffic to port 8000
- CloudWatch log delivery and a health check at `/health`

That is enough to show the deployment path without hiding ECS behind a large application.

## The Container

Create a CDK project with an `app` directory next to `bin` and `lib`:

```text
ecs-demo/
├── app/
│   ├── app.py
│   └── Dockerfile
├── bin/
└── lib/
```

The service uses Python's standard library, so the image needs no dependency installation step.

```python
# app/app.py
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
  def do_GET(self):
    if self.path == "/health":
      body = b"ok\n"
      self.send_response(200)
    elif self.path == "/":
      body = b"Hello from ECS\n"
      self.send_response(200)
    else:
      body = b"Not found\n"
      self.send_response(404)

    self.send_header("Content-Type", "text/plain")
    self.send_header("Content-Length", str(len(body)))
    self.end_headers()
    self.wfile.write(body)


HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
```

The process listens on `0.0.0.0` so the load balancer can reach it over the task network. Binding only to `localhost` would make the task appear unhealthy.

```dockerfile
# app/Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY app.py .

EXPOSE 8000
CMD ["python", "app.py"]
```

## Defining the ECS Service with CDK

The `ApplicationLoadBalancedFargateService` pattern creates the task definition, ECS service, security groups, target group, and load balancer together. That keeps the deployment concrete without manually wiring every load balancer resource.

```typescript
// lib/ecs-demo-stack.ts
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class EcsDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, "Cluster", { vpc });
    const logGroup = new logs.LogGroup(this, "LogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "Service",
      {
        cluster,
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        publicLoadBalancer: true,
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset("app"),
          containerPort: 8000,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: "ecs-demo",
            logGroup,
          }),
        },
      },
    );

    service.targetGroup.configureHealthCheck({
      path: "/health",
      healthyHttpCodes: "200",
    });

    new cdk.CfnOutput(this, "ServiceUrl", {
      value: `http://${service.loadBalancer.loadBalancerDnsName}`,
    });
  }
}
```

The important settings are the boundaries between the resources:

- `fromAsset("app")` builds the image locally and publishes it through CDK's bootstrap resources.
- `taskImageOptions` defines port `8000` and sends container output to CloudWatch Logs.
- `taskSubnets` keeps tasks private while the public load balancer receives internet traffic.
- `configureHealthCheck` gives the load balancer a readiness endpoint.
- `desiredCount` tells the ECS service how many tasks to keep running.

The pattern also creates the task execution role needed to pull the image and write logs.

## Deploying and Testing

From the CDK project directory, install the dependencies and bootstrap the account and region once:

```bash
npm install aws-cdk-lib constructs
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

Preview and deploy the stack:

```bash
npx cdk diff
npx cdk deploy
```

CDK builds the image, publishes it to ECR, creates the VPC and ECS resources, and prints the load balancer URL:

```bash
curl http://LOAD_BALANCER_DNS_NAME/
curl -i http://LOAD_BALANCER_DNS_NAME/health
```

The first request should return `Hello from ECS`; the health check should return `200` and `ok`. If the target stays unhealthy, check the port, bind address, and task logs.

When finished, remove the stack so its resources do not continue to incur charges:

```bash
npx cdk destroy
```

## Production Trade-offs

The pattern creates several resources on your behalf:

- An ECS task definition and Fargate service
- IAM roles for task execution
- Security groups for the load balancer and tasks
- An Application Load Balancer, listener, and target group
- CloudWatch log configuration
- VPC networking resources

Use the pattern for a straightforward service. Move to separate `ecs.FargateTaskDefinition`, `ecs.FargateService`, and Elastic Load Balancing constructs when you need multiple listeners, custom deployment behavior, service discovery, blue/green releases, or tighter ownership boundaries.

For production, add HTTPS, autoscaling, secret management, image scanning, and alarms for errors, latency, CPU, memory, and unhealthy targets. Run at least two tasks across multiple Availability Zones when availability matters. Keep the application stateless: use S3 for files, a database for records, and a queue for background work.

This example also creates one NAT Gateway because the tasks run in private subnets. That gateway has an hourly charge even when traffic is low, so the demo can cost more than the Fargate task itself. Delete the stack when you are finished experimenting.

## When Not to Use ECS

- Use Lambda for short, event-driven work where paying per invocation matters.
- Use App Runner or another simpler managed platform when you do not need ECS's infrastructure control.
- Use EKS when Kubernetes compatibility or its ecosystem is a firm organizational need.
- Avoid ECS when the team is not prepared to own container builds, security updates, scaling rules, and service monitoring.

## The Takeaway

- ECS provides the orchestration needed to run containers reliably on AWS.
- Fargate removes host management while ECS handles task scheduling and service health.
- CDK defines the image, networking, task, service, and load balancer as one repeatable deployment.
- The trade-off is more operational responsibility than Lambda in exchange for fewer runtime constraints and more control.
