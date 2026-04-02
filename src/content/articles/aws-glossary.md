---
title: AWS Glossary - Networking, Serverless, Compute, and Databases
date: 2026-03-29
excerpt: Definitions for the AWS services and concepts covered across the architecture articles on this site. VPCs, subnets, Lambda, API Gateway, EventBridge, SQS, Step Functions, RDS, Aurora, security groups, and everything in between.
draft: false
---

A reference glossary for the AWS terms, services, and patterns covered in depth across the architecture articles on this site. Entries span networking, serverless compute and eventing, load balancing, managed databases, security, and operations tooling - grouped thematically and written to explain not just what a thing is, but why it exists and how it fits into the broader picture.

## Networking

### Virtual Private Cloud (VPC)

A VPC is a logically isolated network that you define inside an AWS region. All resources you deploy - EC2 instances, RDS databases, load balancers - live inside a VPC. You control the IP address range (via CIDR), how subnets are divided within it, and what traffic flows in and out. Nothing reaches your resources unless it has an explicit path through route tables and security groups.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### CIDR

Classless Inter-Domain Routing (CIDR) is the notation used to express IP address ranges. A VPC CIDR like `10.0.0.0/16` means all addresses from `10.0.0.0` to `10.0.255.255` - 65,536 addresses total. Subnets carve smaller ranges out of the VPC CIDR: `10.0.0.0/24` gives you 256 addresses. The `/` number is the prefix length; a higher number means a smaller range.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Availability Zone (AZ)

An Availability Zone is a physically separate data center (or cluster of data centers) within an AWS region, with independent power, cooling, and networking. Distributing resources across multiple AZs means a hardware or power failure in one zone doesn't take down your application. Most production architectures use a minimum of two AZs for every tier - the cost of redundancy is almost always worth it.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Subnet

A subnet is a range of IP addresses within a VPC, confined to a single Availability Zone. Resources in different subnets communicate over the VPC's internal network. What makes a subnet "public," "private," or "isolated" is entirely determined by its route table - there's no separate subnet type in AWS console terms; it's just routing.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Public Subnet

A subnet whose route table has a `0.0.0.0/0` entry pointing to an Internet Gateway. Resources placed here can initiate and receive traffic from the internet, provided they also have a public or Elastic IP address assigned. In a three-tier architecture, only the Application Load Balancer and NAT Gateways live in public subnets.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Private Subnet

A subnet whose route table sends `0.0.0.0/0` to a NAT Gateway rather than an Internet Gateway. Resources in a private subnet can reach the internet for outbound calls (package downloads, API calls, fetching secrets) but cannot be reached inbound from the internet - there is no path back. Application tier EC2 instances live here.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Isolated Subnet

A subnet with no route to the internet at all. The route table contains only the VPC-local route (`10.0.0.0/16 → local`). Resources here are reachable only from within the VPC itself. This is where your database belongs - placing RDS in an isolated subnet makes internet inaccessibility a network constraint, not a firewall rule that could be accidentally loosened.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Route Table

A route table is a set of rules that determines where network traffic is directed. Each subnet is associated with exactly one route table. The most important entry is the default route (`0.0.0.0/0`), which determines what happens to traffic that doesn't match a more specific rule - and this is what makes a subnet public, private, or isolated.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Internet Gateway (IGW)

An Internet Gateway is a horizontally-scaled, redundant AWS-managed component that you attach to a VPC to enable bidirectional internet access. Without one, no subnet in your VPC has any internet route at all. An IGW is always highly available - you don't provision multiple; it scales automatically. Resources in a public subnet also need a public or Elastic IP to be reachable inbound from the internet.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### NAT Gateway

A NAT (Network Address Translation) Gateway sits in a public subnet and translates the private IP addresses of outbound requests from private subnets into its own public Elastic IP. This allows EC2 instances with no public IP to reach the internet for outbound calls, while remaining unreachable inbound. Each AZ should have its own NAT Gateway - sharing one across AZs creates a single point of failure for outbound connectivity.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Elastic IP

An Elastic IP is a static public IPv4 address you allocate to your AWS account. Unlike a standard public IP (which changes on stop/start), an Elastic IP persists until you release it. NAT Gateways require an Elastic IP. Resources like NAT Gateways use the Elastic IP as their public-facing identity so that outbound traffic from your private subnets appears to come from a consistent, known address.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Elastic Network Interface (ENI)

An ENI is a virtual network interface that you can attach to an EC2 instance, Lambda function in a VPC, or other resource. Security groups are attached to ENIs, not to instances directly. Every EC2 instance has at least one primary ENI. The distinction matters because security groups evaluate traffic at the ENI boundary - it's where stateful connection tracking happens.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### VPC Endpoint

A VPC Endpoint lets resources in your VPC connect to AWS services (S3, Secrets Manager, CloudWatch, etc.) over the AWS private network instead of routing through the public internet via a NAT Gateway. Interface Endpoints are ENI-based (powered by AWS PrivateLink) and support most AWS services. Using endpoints eliminates NAT Gateway data processing charges for AWS API traffic and keeps all traffic within the AWS backbone.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

---

## Compute and Load Balancing

### Amazon EC2

Elastic Compute Cloud (EC2) is AWS's virtual machine service. You choose an instance type (CPU, RAM, network bandwidth), an AMI (operating system image), a VPC subnet to place it in, and one or more security groups. In a three-tier architecture, EC2 instances form the application tier - they run your application code in private subnets, invisible to the internet, reachable only through the load balancer.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Auto Scaling Group (ASG)

An Auto Scaling Group manages a fleet of EC2 instances as a single unit. You define a launch template (instance type, AMI, security group, subnet placement) and scaling policies, and the ASG ensures the right number of instances are always running. When a scaling policy triggers (CPU too high, for example), the ASG launches new instances across your configured subnets - distributing automatically across AZs - and registers them with the target group.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Application Load Balancer (ALB)

An ALB operates at Layer 7 (HTTP/HTTPS) and distributes incoming requests across healthy targets in a target group. It terminates TLS, so your EC2 instances receive plain HTTP internally. An ALB lives in the public subnets across multiple AZs and is the single public-facing entry point for a three-tier architecture. It never has a static IP - it's referenced through a DNS name, and your domain's CNAME points to it.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Target Group

A target group is the set of resources (EC2 instances, Lambda functions, IP addresses) that an ALB listener routes traffic to. The ALB performs health checks against targets in the group and stops sending traffic to unhealthy ones. When an ASG scales out, new instances automatically register themselves with the configured target group - and deregister when they're terminated.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Listener

A listener is a process on the ALB that checks for incoming connection requests on a specific port and protocol. A typical production setup has two listeners: one on port 80 (HTTP, which redirects to HTTPS) and one on port 443 (HTTPS, which forwards to the target group). Listeners use rules to route traffic - you can route based on path (`/api/*`), host header, query string, or other attributes.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Health Check

The ALB periodically sends an HTTP request to each registered target (e.g., `GET /health`) to determine if it's healthy enough to receive traffic. If a target fails the configured number of consecutive checks, the ALB stops sending it requests. Healthy instances continue to receive traffic, and the ASG uses health check failures as a signal to replace the instance.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

---

## Serverless and Eventing

### AWS Lambda

Lambda is AWS's serverless compute service. You deploy a function - a unit of code with a defined handler - and AWS runs it in response to events without you managing servers, EC2 instances, or operating systems. Lambda handles provisioning, scaling, and decommissioning the underlying execution environment. You pay only for the duration your code runs, measured in milliseconds.

_Covered in depth in [Intro to AWS Lambda](/articles/intro-to-aws-lambda) and [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda)._

### Lambda Handler

The Lambda handler is the entry point function that Lambda invokes when your function is triggered. It receives two arguments: `event` (the triggering payload - varies by event source) and `context` (runtime metadata like function name, memory limit, and request ID). For Python, a typical handler looks like `def handler(event, context):`. For Node.js it's `export const handler = async (event) => {}`.

_Covered in depth in [Intro to AWS Lambda](/articles/intro-to-aws-lambda)._

### Cold Start

A cold start occurs when Lambda has to initialize a new execution environment from scratch before running your function - pulling the code package, starting the runtime, and executing any initialization code outside the handler. A warm start reuses an already-initialized environment. Cold starts add latency ranging from tens of milliseconds (small Node.js or Python functions) to several seconds for large packages or heavy runtimes like the JVM. VPC-attached functions previously had dramatically longer cold starts due to ENI provisioning, but AWS resolved this in 2019 with Hyperplane ENIs - shared network interfaces provisioned at deploy time rather than per cold start. Provisioned concurrency eliminates cold starts entirely for latency-sensitive workloads by keeping environments pre-initialized.

_Covered in depth in [Intro to AWS Lambda](/articles/intro-to-aws-lambda)._

### Lambda Execution Role

The IAM role attached to a Lambda function. Lambda's execution environment assumes this role to make AWS API calls - reading from S3, writing to DynamoDB, publishing to SQS, writing logs to CloudWatch. The principle of least privilege applies: each function should have its own role with only the permissions it actually needs. This role is separate from the role that deploys or invokes the function.

_Covered in depth in [Intro to AWS Lambda](/articles/intro-to-aws-lambda)._

### Lambda Layers

A Lambda Layer is a ZIP archive of shared dependencies, utilities, or configuration that you attach to multiple functions rather than bundling into each deployment package. Common use cases: shared library code, heavy ML model files, binary executables like `ffmpeg`, or the Lambda Powertools observability library. A function can reference up to five layers simultaneously. Layers don't change how the function is invoked; they simply make their content available at a known path inside the execution environment.

_Covered in depth in [Intro to AWS Lambda](/articles/intro-to-aws-lambda)._

### Concurrency

Lambda concurrency is the number of function instances running simultaneously. Each concurrent execution handles exactly one event at a time. When a second event arrives while the first is still in progress, Lambda spins up a second execution environment - a cold start if no warm environment is available. Reserved concurrency caps a function's maximum simultaneous executions, preventing it from starving other functions in the same account or overwhelming a downstream database. Provisioned concurrency pre-warms a fixed number of environments to absorb traffic without cold-start latency.

_Covered in depth in [Intro to AWS Lambda](/articles/intro-to-aws-lambda)._

### Event Source Mapping

An Event Source Mapping is a Lambda-managed resource that polls a queue or stream on your behalf - SQS, Kinesis, DynamoDB Streams, or Kafka - and invokes your function with batches of records. Unlike push-based triggers (API Gateway, S3 notifications), the mapping is a continuous poll loop managed by the Lambda service. You configure batch size, batching window, and error handling behavior. Failed batches can be routed to a dead-letter queue for inspection or discarded after a configurable number of retries.

_Covered in depth in [Amazon EventBridge - Event-Driven Architecture on AWS](/articles/amazon-eventbridge)._

### Amazon API Gateway

API Gateway is a managed service for creating, publishing, and securing HTTP APIs that invoke Lambda functions, proxy HTTP backends, or interact with other AWS services directly. There are two main types: REST API (feature-rich, supports caching, request transformation, API keys, and usage plans) and HTTP API (lower cost and latency, fewer features, best for straightforward Lambda proxy use cases). API Gateway handles request routing, payload transformation, authorization, throttling, and TLS termination.

_Covered in depth in [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda)._

### Lambda Proxy Integration

The most common API Gateway → Lambda integration pattern. API Gateway forwards the entire HTTP request to Lambda as a structured JSON event - including headers, query string parameters, path parameters, and body - and expects Lambda to return a JSON object with `statusCode`, `headers`, and `body`. This design gives your function full control over the HTTP response without any API Gateway response mapping. With HTTP APIs, proxy integration is the only available integration type.

_Covered in depth in [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda)._

### Stage

An API Gateway Stage is a named deployment snapshot of your API that has an actual invocable URL. Stages let you run multiple versions simultaneously: `prod`, `staging`, `v1`, `v2`. The stage name is embedded in the URL: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/{resource}`. Stage variables act as environment-specific configuration, allowing different stages to point to different Lambda function aliases or backend URLs without duplicating the API definition.

_Covered in depth in [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda)._

### Authorizer

An API Gateway Authorizer is a Lambda function or Cognito User Pool that API Gateway invokes before passing a request to your backend. A Lambda Authorizer receives the request token or full request context, validates it, and returns an IAM policy document that allows or denies access. Cognito Authorizers validate JWTs directly without a Lambda round-trip. Authorizers let you protect API endpoints without embedding authentication logic inside your handler functions.

_Covered in depth in [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda)._

### Amazon SQS

Simple Queue Service (SQS) is a managed message queue that decouples producers from consumers. Producers write messages to a queue; consumers poll and process them at their own pace. Standard queues offer maximum throughput with at-least-once delivery (duplicates possible, ordering not guaranteed). FIFO queues guarantee exactly-once processing and strict ordering within a message group, at lower throughput ceilings. Messages not processed within the visibility timeout reappear in the queue; messages that fail repeatedly route to a dead-letter queue (DLQ) for inspection.

_Covered in depth in [Amazon EventBridge - Event-Driven Architecture on AWS](/articles/amazon-eventbridge)._

### Amazon SNS

Simple Notification Service (SNS) is a managed pub/sub messaging service. Publishers write to an SNS topic; every subscribed endpoint receives a copy of the message. Subscribers can be Lambda functions, SQS queues, HTTP endpoints, email addresses, or SMS numbers - making SNS the standard fan-out mechanism for event-driven systems. SNS is also the delivery target for CloudWatch alarms: when an alarm fires (5xx rate too high, CPU spike, low memory), the alarm publishes to a topic that routes to your Slack channel, email, or PagerDuty integration.

_Covered in depth in [Amazon EventBridge - Event-Driven Architecture on AWS](/articles/amazon-eventbridge) and [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Amazon EventBridge

EventBridge is a serverless event bus that routes events between AWS services, your own applications, and third-party SaaS providers. You define rules that match events by their content - source, detail-type, or specific JSON field values - and route matching events to targets: Lambda functions, SQS queues, Step Functions state machines, and more. EventBridge decouples event producers from consumers entirely: the producer publishes to the bus without knowing who's listening. The Schema Registry documents event shapes and generates typed SDKs for producers and consumers.

_Covered in depth in [Amazon EventBridge - Event-Driven Architecture on AWS](/articles/amazon-eventbridge)._

### AWS Step Functions

Step Functions is a serverless orchestration service for building multi-step workflows as visual state machines. Each state can invoke a Lambda function, call an AWS service directly (DynamoDB, S3, ECS), run parallel branches, wait for an external callback, or pause on a timer. Standard workflows maintain full execution history (every state transition visible in the console) and support long-running processes up to one year. Express workflows are higher-throughput and lower-cost, better suited for short event-processing pipelines that run in under five minutes.

_Covered in depth in [Building Data Pipelines with Step Functions and Lambda](/articles/building-data-pipelines-with-step-functions-and-lambda)._

### Event-Driven Architecture

Event-driven architecture is a design pattern where services communicate by producing and consuming events rather than making direct synchronous API calls. A service publishes an event when something meaningful happens - an order was placed, a file uploaded, a payment processed - and other services subscribe and react independently. This decoupling makes services independently deployable and scalable, eliminates the brittleness of synchronous request/response chains, and lets new consumers attach without modifying the producer. EventBridge, SQS, and SNS are the primary AWS primitives for building event-driven systems.

_Covered in depth in [Amazon EventBridge - Event-Driven Architecture on AWS](/articles/amazon-eventbridge)._

---

## Databases

### Amazon RDS

Relational Database Service (RDS) is a managed service that runs a relational database engine - PostgreSQL, MySQL, MariaDB, Oracle, SQL Server, or IBM Db2 - on a managed EC2-backed instance. AWS handles OS patching, backups, minor version upgrades, and Multi-AZ standby provisioning. The storage model is straightforward: an EBS volume attached to the instance, with synchronous replication to a standby in Multi-AZ deployments.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Amazon Aurora

Aurora is AWS's cloud-native relational database engine, compatible with PostgreSQL and MySQL. The key architectural difference from RDS is its distributed cluster volume: instead of an EBS volume attached to a single instance, Aurora stores data across six storage nodes in three Availability Zones. All compute nodes in the cluster share this single storage layer, which is what makes Aurora's failover fast and its replica lag low.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Multi-AZ (RDS)

An RDS Multi-AZ deployment provisions a second, standby instance in a separate Availability Zone and keeps it synchronized via synchronous block-level replication. The standby is not readable - it exists purely for failover. If AWS detects a failure on the primary (hardware, storage, OS), it flips the DNS endpoint to the standby. This failover typically takes 60–120 seconds.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Multi-AZ Cluster (RDS)

An RDS Multi-AZ Cluster is a newer deployment option for PostgreSQL and MySQL that provisions two readable standby instances using semi-synchronous replication. Unlike the traditional Multi-AZ standby, the standbys can serve read traffic. Failover is faster than traditional Multi-AZ and the additional read capacity reduces load on the primary.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Read Replica

A read replica is a copy of a database that receives changes from the primary via asynchronous replication. Read replicas can serve read-only queries, offloading the primary for reporting or read-heavy workloads. RDS supports up to 5 read replicas per instance; Aurora supports up to 15. Aurora's replicas share the same distributed storage volume as the writer, which is why their replica lag is typically under 100ms - they're reading from shared storage, not applying a replication stream.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Aurora Serverless v2

Aurora Serverless v2 replaces fixed-size Aurora instances with continuously scaling compute measured in Aurora Capacity Units (ACUs). You set a minimum and maximum ACU range, and Aurora scales within it in 0.5 ACU increments - near-instantly, without the cold-start delay of the original Serverless v1. Serverless v2 does not scale to zero; the minimum ACU floor means you always have a running instance, which avoids cold-start latency but also means you're never at zero cost.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Aurora Capacity Unit (ACU)

An Aurora Capacity Unit is the unit of compute for Aurora Serverless v2 instances. Each ACU is approximately 2 GiB of memory plus proportional CPU and network resources. You're billed per ACU-hour at the current capacity level, meaning the cost rises and falls with actual utilization rather than being fixed at the provisioned instance size.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Aurora Global Database

Aurora Global Database spans up to five AWS regions. A single primary region accepts all writes; up to five secondary regions replicate data via dedicated storage-layer replication infrastructure with sub-second RPO. Secondary regions expose read endpoints so that users in those regions can query a local copy rather than routing to the primary region. In a disaster recovery scenario, a secondary region can be promoted to primary in under a minute.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### RDS Proxy

RDS Proxy is a managed connection pooler that sits between your application and an RDS or Aurora database. It pools and multiplexes connections to the database, which is critical for workloads with many short-lived connections - like AWS Lambda functions or aggressively scaled ASGs - that would otherwise exhaust the database's `max_connections`. RDS Proxy also provides faster failover handling; during an RDS Multi-AZ or Aurora failover, the proxy pins connections and transparently reconnects to the new primary.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Performance Insights

Performance Insights is a database monitoring feature built into RDS and Aurora. It visualizes database load over time, broken down by wait event, SQL query, user, and host. The default 7-day retention window is free. When a query starts degrading performance, Performance Insights tells you exactly which SQL statement, what it's waiting on (I/O, locks, CPU), and how long it's been a problem.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Point-in-Time Recovery (PITR)

PITR lets you restore an RDS or Aurora database to any second within your backup retention window - not just to the most recent automated snapshot. AWS achieves this by continuously shipping transaction logs to S3 alongside daily automated snapshots. For Aurora, you can restore to any second within the retention period. For RDS, the granularity depends on transaction log shipping frequency.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Parameter Groups

A Parameter Group is a container for database engine configuration settings - things like `max_connections`, `work_mem`, `shared_buffers`, and logging verbosity. RDS and Aurora instances use Parameter Groups instead of letting you edit `postgresql.conf` or `my.cnf` directly. Aurora also has Cluster Parameter Groups for settings that apply cluster-wide, separate from DB Parameter Groups that apply per-instance.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Amazon EBS (gp3 / io2 Block Express)

Elastic Block Store (EBS) is the block storage that backs RDS instances. The `gp3` volume type is the default for new RDS instances - it provides a solid baseline of IOPS and throughput at a predictable cost. `io2 Block Express` is a high-performance option for workloads that need up to 256,000 IOPS per instance. Aurora doesn't use EBS volumes attached to individual instances; its storage is managed by the Aurora distributed storage subsystem.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Aurora I/O-Optimized Pricing

In Aurora's default pricing model, you pay per I/O operation in addition to the compute and storage costs. Aurora I/O-Optimized is an alternative pricing configuration that eliminates per-I/O charges and increases the cluster cost by approximately 25%. It becomes cost-effective when I/O charges exceed 25% of your total Aurora bill - common on write-heavy workloads. It's a cluster-level configuration, not a deployment type.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### RPO and RTO

Recovery Point Objective (RPO) is how much data loss is acceptable in a failure scenario - measured as the time gap between the last recovery point and the failure. Recovery Time Objective (RTO) is how long it should take to restore service after a failure. For Aurora Global Database, the RPO is sub-second (replication lag) and the RTO for a managed failover is under a minute. For RDS Multi-AZ, the RTO is 60–120 seconds with RPO near-zero (synchronous replication means no committed transactions are lost).

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

---

## Security

### Security Group

A security group is a stateful virtual firewall attached to an Elastic Network Interface (ENI). Rules define what inbound and outbound traffic is allowed - there is no explicit deny rule type; anything not allowed is blocked by default. "Stateful" means return traffic for an allowed outbound connection is automatically permitted without a matching inbound rule. Security groups can reference other security groups as sources or destinations, which is the preferred pattern for tiers that scale dynamically.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Network ACL (NACL)

A Network ACL is a subnet-level, stateless firewall that evaluates traffic entering or leaving a subnet. Unlike security groups, NACLs are stateless - you must explicitly allow both the request direction and the return direction (which uses ephemeral ports 1024–65535). Rules are numbered and evaluated top-down; the first matching rule wins. NACLs are useful for subnet-wide deny rules (blocking a known bad IP range) that security groups can't express, since security groups have no "deny" rule type.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### IAM Role

An IAM Role is an AWS identity with permissions that can be assumed by a service or resource. EC2 instances are assigned an IAM role at launch - it's how they call AWS APIs (Secrets Manager, S3, CloudWatch) without hard-coding credentials. Roles use temporary credentials that rotate automatically, eliminating the risk of long-lived access keys being leaked from instance metadata or logs.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### AWS Secrets Manager

Secrets Manager stores and rotates sensitive values - database credentials, API keys, OAuth tokens - and makes them accessible to your application via the AWS SDK. For RDS, CDK's `rds.Credentials.fromGeneratedSecret()` auto-generates a strong password, stores the username, password, host, and port as a JSON secret, and optionally rotates it on a schedule. Your application fetches the secret at startup by ARN; no plaintext credentials exist in environment variables or code.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws) and [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### AWS KMS

AWS Key Management Service (KMS) manages the encryption keys used to encrypt data at rest across AWS services. RDS and Aurora storage encryption sits on top of KMS - enabling `storageEncrypted: true` in CDK creates or uses a KMS key to encrypt the underlying EBS volume or Aurora distributed storage. Encryption has no meaningful performance impact and cannot be enabled on an existing unencrypted instance after creation.

_Covered in depth in [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### AWS Certificate Manager (ACM)

ACM provisions and manages TLS certificates for use with AWS services. An ALB HTTPS listener requires an ACM certificate - this is how the ALB terminates TLS on behalf of your application. ACM certificates are free for use with AWS services and renew automatically. Your EC2 instances receive plain HTTP from the ALB internally; they never need to handle TLS.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### AWS Systems Manager Session Manager (SSM)

SSM Session Manager provides secure shell access to EC2 instances - including instances in private subnets with no public IP - through the AWS console or CLI. It requires no open SSH port, no bastion host, and no SSH key management. All session activity is logged to CloudWatch or S3. It's the preferred approach for administrative access to EC2 instances in production; opening port 22 is an unnecessary attack surface.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

---

## Operations and Tooling

### AWS CDK

The AWS Cloud Development Kit (CDK) is an infrastructure-as-code framework that lets you define AWS resources in TypeScript, Python, Java, or other languages. CDK synthesizes your code into CloudFormation templates, which AWS then deploys. The advantage over writing CloudFormation YAML directly is that CDK constructs handle common patterns automatically - the `Vpc` construct manages subnets, route tables, IGW, and NAT Gateways for you when you specify subnet configuration.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws) and [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### AWS CloudFormation

CloudFormation is AWS's native infrastructure-as-code service. You define resources in YAML or JSON templates and CloudFormation provisions and manages them as a stack. CDK compiles down to CloudFormation, so understanding CloudFormation concepts - stacks, logical IDs, change sets, drift - helps you debug CDK deployments. CloudFormation tracks the desired state of your infrastructure and handles creation, update, and deletion in the correct dependency order.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

### Amazon CloudWatch

CloudWatch is AWS's observability service for metrics, logs, and alarms. EC2, RDS, and Aurora emit metrics here by default - CPU utilization, database connections, freeable memory, read/write IOPS, and more. You create alarms that trigger SNS notifications when metrics cross thresholds. CloudWatch Logs collects application logs, VPC Flow Logs, and RDS error logs in one place. Performance Insights data for RDS and Aurora integrates with CloudWatch for long-term trend analysis.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws) and [AWS RDS vs Aurora: Choosing the Right Managed Database](/articles/aws-rds-vs-aurora)._

### Amazon Route 53

Route 53 is AWS's managed DNS service. In a three-tier architecture, your domain's DNS record is a CNAME or Route 53 Alias record pointing to the ALB's DNS name. Route 53 also handles internal DNS resolution within a VPC - when you connect to an RDS instance, the endpoint hostname (`mydb.xxxxxx.us-east-1.rds.amazonaws.com`) resolves via Route 53 to the correct IP address, and after a failover the same hostname resolves to the new primary's IP without any application-side change.

_Covered in depth in [Three-Tier Architecture on AWS](/articles/three-tier-architecture-on-aws)._

---

## The Takeaway

- **Routing determines subnet type.** Public, private, and isolated subnets are the same AWS resource with different route tables. Understanding routing is understanding VPC networking.
- **Security groups work in chains, not perimeters.** The SG-to-SG reference pattern - alb-sg → app-sg → db-sg - is more robust than CIDR-based rules because it follows your resources as they scale, not their current IPs.
- **Lambda's execution model is the key to understanding serverless.** Cold starts, concurrency, execution roles, and event source mappings define the boundaries of what Lambda can do and what gotchas to watch for.
- **API Gateway and Lambda own the request/response contract together.** With Lambda proxy integration, your function controls the entire HTTP response - API Gateway is the router, not the processor.
- **Event-driven systems decouple at the cost of complexity.** EventBridge, SQS, SNS, and Step Functions each solve a distinct coordination problem - routing rules, queueing, fan-out, and orchestration. Choosing the right primitive matters.
- **Aurora and RDS share an interface, not an architecture.** Aurora's distributed storage layer is why it has faster failover, lower replica lag, and higher read replica limits. The terms here - ACU, distributed volume, pointer swap failover - are the vocabulary for understanding that difference.
- **Managed services shift responsibility, not ownership.** RDS handles OS patches and Multi-AZ standby provisioning, but you still own subnet placement, security group rules, encryption settings, and backup retention. Knowing the vocabulary for each service is what makes those decisions deliberate.
