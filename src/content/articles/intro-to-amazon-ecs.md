---
title: "Intro to Amazon ECS"
date: 2026-09-16
excerpt: ECS runs containerized applications without making you build a container orchestration platform yourself. Here is where it fits, why to use it, and how to deploy a service with Fargate and CDK.
draft: false
tags: ["aws", "ecs", "cdk"]
---

Running one container is simple. Keeping it healthy, replacing failed instances, scaling it, and routing production traffic takes more infrastructure. Amazon ECS manages that orchestration while still letting you package an application as a standard container.

## What Is Amazon ECS?

Amazon Elastic Container Service (ECS) is AWS's managed container orchestration service for deploying, running, and scaling containerized applications.

A container image packages the application and its dependencies. A task definition describes how ECS should run that image, a task is one running instance of the definition, and a service keeps the desired number of tasks running.

ECS schedules and runs containers, but it does not build their images; those images are created separately and typically stored in Amazon Elastic Container Registry (ECR).

ECS can run tasks on EC2 instances that you provision and maintain, or on AWS Fargate, where AWS manages the underlying compute capacity for you.

- Use Fargate for the article's deployment so no container hosts need to be managed.

## Why Use ECS?

- Run long-lived APIs, workers, and scheduled jobs without Lambda's execution limit.
- Package the application and its runtime dependencies into one portable image.
- Let ECS replace unhealthy tasks and maintain the desired task count.
- Scale tasks independently from the underlying application release.
- Integrate with ECR, load balancers, CloudWatch, IAM, and VPC networking.
- Keep more infrastructure control than serverless functions without adopting Kubernetes.

## How an ECS Service Fits Together

- Store the application image in Amazon ECR.
- Create an ECS cluster as the logical home for the workload.
- Use a task definition to configure the image, CPU, memory, ports, environment, and IAM roles.
- Run the task definition through an ECS service that maintains the desired number of tasks.
- Place Fargate tasks in private subnets and expose them through an Application Load Balancer.
- Send application logs to CloudWatch and use health checks to replace failed tasks.

## What We're Building

The example is a small Python HTTP service with one endpoint and one health check.
The CDK stack will create:

- A VPC with public subnets for the load balancer and private subnets for tasks
- An ECS cluster running on Fargate
- A task definition with 256 CPU units and 512 MiB of memory
- An Application Load Balancer that forwards traffic to port 8000
- CloudWatch log delivery for the container
- A health check at `/health`

This is enough to show the deployment path without hiding the important ECS resources behind a large application.

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

The service only uses Python's standard library, so the image has no dependency installation step.

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

The process must listen on `0.0.0.0`, not only on `localhost`. The load balancer reaches the container over the task network, so binding to the loopback interface would make the task appear unhealthy.

```dockerfile
# app/Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY app.py .

EXPOSE 8000
CMD ["python", "app.py"]
```

## Defining the ECS Service with CDK

The `ApplicationLoadBalancedFargateService` pattern creates the task definition, ECS service, security groups, target group, and load balancer together. The higher-level construct is useful here because the article is about the ECS deployment model rather than manually wiring every load balancer resource.

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

The important settings are not the exact numbers. They are the boundaries between the resources:

- `fromAsset("app")` builds the Docker image locally and uploads it through the CDK bootstrap resources. CDK also creates an ECR repository for the asset.
- `taskImageOptions` defines the container port and sends stdout and stderr to CloudWatch Logs.
- `taskSubnets` keeps tasks in private subnets while the public load balancer remains reachable from the internet.
- `configureHealthCheck` makes the load balancer ask the application whether it is ready to receive traffic.
- `desiredCount` tells the ECS service how many task instances to keep running.

The service's task execution role needs permission to pull the image and write logs. The CDK pattern creates that role and its policy for this setup.

## Deploying and Testing

From the CDK project directory, install the dependencies and bootstrap the account and region once:

```bash
npm install aws-cdk-lib constructs
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

Then preview and deploy the stack:

```bash
npx cdk diff
npx cdk deploy
```

CDK builds the Docker image, publishes it to ECR, creates the VPC and ECS resources, and prints the load balancer URL from the `ServiceUrl` output. Test both the application and its health check:

```bash
curl http://LOAD_BALANCER_DNS_NAME/
curl -i http://LOAD_BALANCER_DNS_NAME/health
```

The first request should return `Hello from ECS`. The health check should return `200` and `ok`. If the target stays unhealthy, check that the container listens on port 8000, binds to `0.0.0.0`, and writes startup errors to the task log stream.

When finished experimenting, remove the stack so the load balancer, NAT gateway, and Fargate service do not continue to incur charges:

```bash
npx cdk destroy
```

## What the Higher-Level Construct Hides

The pattern is convenient, but it is not magic. It creates several lower-level resources on your behalf:

- An ECS task definition and Fargate service
- IAM roles for task execution
- Security groups for the load balancer and tasks
- An Application Load Balancer, listener, and target group
- CloudWatch log configuration
- Networking resources from the VPC construct

Use the pattern for a straightforward service. Move to separate `ecs.FargateTaskDefinition`, `ecs.FargateService`, and Elastic Load Balancing constructs when you need multiple listeners, custom deployment behavior, service discovery, blue/green releases, or tighter ownership boundaries.

For production, also decide on a removal policy, log retention period, autoscaling policy, HTTPS termination, domain name, secret management, and container image scanning. The example keeps those choices small so the ECS lifecycle is visible.

## When Not to Use ECS

- Use Lambda for short, event-driven work where paying only per invocation matters.
- Use a simpler managed platform when infrastructure control is not a requirement.
- Use EKS when Kubernetes compatibility or its ecosystem is a firm organizational need.
- Avoid ECS when the team is not prepared to own container builds, security updates, scaling rules, and service monitoring.

## The Takeaway

- ECS provides the orchestration needed to run containers reliably on AWS.
- Fargate removes host management while ECS handles scheduling and service health.
- CDK can define the image build, networking, task, service, and load balancer as one repeatable deployment.
- The trade-off is more operational responsibility than Lambda in exchange for fewer runtime constraints and more control.
