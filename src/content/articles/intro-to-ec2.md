---
title: "Intro to Amazon EC2"
date: 2026-04-26
excerpt: EC2 is AWS's virtual machine service - rent compute capacity in the cloud, pay by the hour. Here's what it is, when to use it over serverless options, the configuration knobs that matter, and how to provision it with CDK.
draft: false
---

## What Is EC2?

EC2 (Elastic Compute Cloud) is AWS's virtual machine service. You provision an instance - pick a CPU/memory profile, an operating system, storage configuration, and networking settings - and AWS runs it on physical hardware in a data center. The instance behaves like a server you own, except you rent it by the hour and can terminate it whenever you want.

The core value proposition: full control over the compute environment. You choose the OS, install any software, open any ports, run any process, and keep it running as long as you need. Unlike Lambda, there's no runtime limit, no cold start, and no constraint on what the instance can do.

EC2 is the foundation of a large portion of AWS infrastructure. ECS, EKS, RDS, and Elastic Beanstalk all run on EC2 under the hood, even when you're not managing instances directly.

## Instance Types

Instance types define the CPU and memory profile of your virtual machine. They follow a naming pattern:

```
m7g.xlarge
│ │  └─ size (nano, micro, small, medium, large, xlarge, 2xlarge, ...)
│ └─ generation (higher = newer hardware)
└─ family (m = general purpose, c = compute, r = memory, g = GPU, t = burstable, ...)
```

**The families you'll reach for most often:**

| Family        | Optimized for             | Example use case                        |
| ------------- | ------------------------- | --------------------------------------- |
| `t4g` / `t3`  | Burstable general purpose | Dev environments, low-traffic apps      |
| `m7g` / `m6i` | Balanced CPU + memory     | Web servers, app backends               |
| `c7g` / `c6i` | Compute-intensive         | High-throughput APIs, batch processing  |
| `r7g` / `r6i` | Memory-intensive          | In-memory caches, large databases       |
| `p4` / `g5`   | GPU                       | ML training, inference, video rendering |

The `g` suffix (e.g., `m7g`, `c7g`) indicates Graviton - AWS's ARM-based processors. Graviton instances typically offer 20–40% better price-performance than equivalent x86 instances and are the default choice for new workloads unless you have a specific x86 dependency.

## AMIs

An AMI (Amazon Machine Image) is the disk image your instance boots from. It defines the operating system, pre-installed software, and initial configuration. Every instance launch starts from an AMI.

**Common choices:**

- **Amazon Linux 2023** - AWS's own Linux distro, optimized for EC2, SSM agent pre-installed. Best default for new instances.
- **Ubuntu** - Familiar for teams with Ubuntu experience, broad package support.
- **Windows Server** - For .NET workloads or Windows-specific tooling.
- **Custom AMIs** - Bake your own from a running instance using `CreateImage`. Useful for speeding up instance launch time by pre-installing dependencies.

AWS provides managed AMIs that receive regular security patches. Prefer managed AMIs over custom ones unless the startup time improvement is worth the maintenance overhead.

## Storage

EC2 instances use two main storage types:

**EBS (Elastic Block Store)** - Network-attached persistent storage. Survives instance stop/terminate (if configured to do so). The default root volume type is `gp3`, a general-purpose SSD. Key types:

| Type  | Use case                                          |
| ----- | ------------------------------------------------- |
| `gp3` | General purpose - the default                     |
| `io2` | High-IOPS databases (MySQL, PostgreSQL)           |
| `st1` | Throughput-optimized HDD - large sequential reads |
| `sc1` | Cold HDD - infrequent access, lowest cost         |

**Instance Store** - Physically attached NVMe SSDs. Extremely fast, but ephemeral - data is lost when the instance stops or terminates. Good for temporary scratch space, caches, or buffers where durability isn't required.

For databases and anything that needs durability, use EBS with `DeleteOnTermination: false`.

## Networking

Each EC2 instance lives in a VPC subnet. The subnet determines:

- Whether the instance gets a public IP (public subnet + auto-assign public IP)
- Which route tables apply (internet gateway access vs. NAT gateway)
- What other resources in the VPC it can reach

**Security groups** are the primary access control mechanism - stateful firewalls that control inbound and outbound traffic at the instance level. Rules specify protocol, port range, and source/destination (IP CIDR or another security group).

**Key pairs** are the default SSH authentication mechanism for Linux instances. AWS stores the public key; you keep the private key. Alternatively, use Systems Manager Session Manager to connect without SSH or open ports - preferred for production.

## Common Use Cases

**Long-running web servers and API backends.** A Node.js, Python, or Go server that needs to hold persistent connections, maintain in-memory state, or run background threads. EC2 with an Auto Scaling Group and a load balancer is the traditional pattern for horizontally scalable web backends.

**Databases.** Self-managed PostgreSQL, MySQL, or Redis on EC2 gives you full control over configuration, storage, and engine version - at the cost of managing backups, failover, and patching yourself. Most teams prefer RDS or Aurora, but self-managed EC2 databases remain common for cost optimization at scale or for database engines not offered as managed services.

**Batch and data processing.** Long-running jobs that exceed Lambda's 15-minute limit - ETL pipelines, data transformations, report generation. EC2 Spot Instances (see below) make this cost-effective.

**CI/CD runners.** Self-hosted GitHub Actions runners, GitLab runners, or Jenkins agents on EC2. Useful when builds need access to private VPC resources or require specific hardware.

**Machine learning inference.** GPU instances (`g5`, `p4`) for serving ML models where latency requirements or model size make Lambda or SageMaker Serverless Inference impractical.

**Bastion hosts / jump boxes.** A small instance in a public subnet used to access resources in private subnets. Increasingly replaced by Systems Manager Session Manager, which eliminates the need for a dedicated bastion.

## Spot, On-Demand, and Reserved Instances

EC2 pricing has three main modes:

**On-Demand** - Pay by the hour or second, no commitment. Highest price, most flexible. Default for most workloads.

**Spot Instances** - Bid on unused EC2 capacity at up to 90% discount. AWS can reclaim a Spot instance with a 2-minute warning when capacity is needed elsewhere. Good for fault-tolerant, interruptible workloads: batch jobs, CI/CD runners, ML training.

**Reserved Instances / Savings Plans** - Commit to 1 or 3 years of usage in exchange for 30–60% discounts. Savings Plans are more flexible (apply across instance families and sizes). Right choice for stable, predictable baseline workloads.

In practice: run your baseline load on Savings Plans, use On-Demand for variable demand, and Spot for batch/background work.

## Auto Scaling Groups

Auto Scaling Groups (ASGs) manage a fleet of EC2 instances and automatically adjust the count based on demand.

Key concepts:

- **Launch template** - Defines the instance configuration (AMI, instance type, security groups, user data, etc.)
- **Desired / Min / Max capacity** - The target count and the bounds ASG will scale within
- **Scaling policies** - Rules that trigger scale-out or scale-in (CPU utilization, custom CloudWatch metrics, scheduled scaling)
- **Health checks** - ASG terminates and replaces unhealthy instances automatically

ASGs are almost always paired with an Application Load Balancer (ALB), which distributes traffic across instances and performs health checks.

## Building with CDK

### Single Instance

```python
from aws_cdk import (
    aws_ec2 as ec2,
    Stack,
)
from constructs import Construct

class Ec2Stack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        vpc = ec2.Vpc(self, "Vpc", max_azs=2)

        instance = ec2.Instance(
            self,
            "WebServer",
            instance_type=ec2.InstanceType("t4g.small"),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(
                cpu_type=ec2.AmazonLinuxCpuType.ARM_64
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )
```

### Auto Scaling Group with Load Balancer

```python
from aws_cdk import (
    aws_ec2 as ec2,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    Stack,
)
from constructs import Construct

class AsgStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        vpc = ec2.Vpc(self, "Vpc", max_azs=2)

        # Launch template
        template = ec2.LaunchTemplate(
            self,
            "LaunchTemplate",
            instance_type=ec2.InstanceType("m7g.large"),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(
                cpu_type=ec2.AmazonLinuxCpuType.ARM_64
            ),
            user_data=ec2.UserData.for_linux(),
        )

        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self,
            "Asg",
            vpc=vpc,
            launch_template=template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=2,
        )

        # Scale on CPU utilization
        asg.scale_on_cpu_utilization("CpuScaling", target_utilization_percent=60)

        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, "Alb", vpc=vpc, internet_facing=True
        )
        listener = alb.add_listener("HttpListener", port=80)
        listener.add_targets(
            "AsgTargets",
            port=80,
            targets=[asg],
            health_check=elbv2.HealthCheck(path="/health"),
        )
```

### User Data

User data runs as a shell script on first boot. Use it to install dependencies or start your application:

```python
user_data = ec2.UserData.for_linux()
user_data.add_commands(
    "dnf update -y",
    "dnf install -y python3-pip",
    "pip3 install gunicorn",
    "gunicorn --bind 0.0.0.0:8000 app:app --daemon",
)

template = ec2.LaunchTemplate(
    self,
    "LaunchTemplate",
    machine_image=ec2.MachineImage.latest_amazon_linux2023(
        cpu_type=ec2.AmazonLinuxCpuType.ARM_64
    ),
    instance_type=ec2.InstanceType("m7g.large"),
    user_data=user_data,
)
```

For complex setup, prefer baking a custom AMI over long user data scripts - user data runs on every new instance launch and doesn't have good error visibility.

### SSM Access (No SSH Required)

Grant the instance an IAM role with SSM access so you can connect via the AWS console or CLI without opening port 22:

```python
from aws_cdk import aws_iam as iam

role = iam.Role(
    self,
    "InstanceRole",
    assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
    ],
)

instance = ec2.Instance(
    self,
    "WebServer",
    instance_type=ec2.InstanceType("t4g.small"),
    machine_image=ec2.MachineImage.latest_amazon_linux2023(
        cpu_type=ec2.AmazonLinuxCpuType.ARM_64
    ),
    vpc=vpc,
    role=role,
)
```

Then connect from your terminal:

```bash
aws ssm start-session --target i-0abc123def456
```

No open inbound security group rules required.

## EC2 vs. Lambda vs. Fargate

These three services cover most general compute needs. Choosing between them is mostly about workload shape:

|                   | EC2                                         | Lambda                              | Fargate                            |
| ----------------- | ------------------------------------------- | ----------------------------------- | ---------------------------------- |
| **Runtime limit** | None                                        | 15 minutes                          | None                               |
| **Startup time**  | Minutes (cold)                              | Milliseconds–seconds                | 10–30 seconds                      |
| **Scaling**       | ASG (minutes)                               | Automatic (seconds)                 | ECS (seconds–minutes)              |
| **Idle cost**     | Full instance cost                          | Zero                                | Zero                               |
| **Control**       | Full OS access                              | Runtime only                        | Container only                     |
| **Best for**      | Long-running servers, databases, SSH access | Event-driven, short-lived functions | Containerized services, batch jobs |

EC2 is the right choice when you need persistent processes, full OS control, or workloads that don't fit Lambda's execution model. For anything containerized, Fargate reduces the operational overhead of managing instances without sacrificing the container abstraction. Lambda is best for event-driven, stateless, short-lived work.
