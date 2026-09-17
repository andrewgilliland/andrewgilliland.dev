---
title: "Intro to Amazon ECS"
date: 2026-09-16
excerpt: ECS runs containerized applications without making you build a container orchestration platform yourself. Here is where it fits, why to use it, and how to deploy a service with Fargate and CDK.
draft: true
tags: ["aws", "ecs", "cdk"]
---

Running one container is simple. Keeping it healthy, replacing failed instances, scaling it, and routing production traffic takes more infrastructure. Amazon ECS manages that orchestration while still letting you package an application as a standard container.

## What Is Amazon ECS?

- Define ECS as AWS's managed container orchestration service.
- Explain the difference between a container image, task definition, task, and service.
- Clarify that ECS schedules containers but does not build application images.
- Introduce EC2 and Fargate as the two main compute options.
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

## Deploying ECS Fargate with CDK

- Start with a small HTTP application and a production-ready `Dockerfile`.
- Create a VPC and ECS cluster with AWS CDK.
- Build and publish the local image with `ecs.ContainerImage.fromAsset`.
- Use `ApplicationLoadBalancedFargateService` to create the task definition, service, and load balancer.
- Configure CPU, memory, desired task count, container port, and health check path.
- Deploy with `cdk deploy`, then test the load balancer URL from the stack output.
- Explain which resources the higher-level CDK construct creates and what should be customized for production.

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
