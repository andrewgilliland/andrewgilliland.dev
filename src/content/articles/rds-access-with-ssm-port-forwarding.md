---
title: "No Bastion Required: Accessing Private RDS with SSM Port Forwarding"
date: 2026-04-27
excerpt: RDS in a private subnet doesn't need a bastion host or an open port 22. AWS Systems Manager port forwarding creates an encrypted tunnel from your laptop to a private endpoint - no public IP, no SSH key management required. Here's how to set it up with CDK.
draft: false
---

## The Problem

You've done the right thing: your RDS instance is in a private subnet. No public IP, no inbound rules from the internet, unreachable from anywhere outside your VPC. But now you need to run database migrations from your laptop, inspect a table in DBeaver, or debug a data issue in production.

The traditional answer is a bastion host - a small EC2 instance in a public subnet with port 22 open, sitting between you and the database. It works, but it introduces operational overhead: you need to manage SSH key pairs, rotate them, audit who has them, keep the instance patched, and remember to stop it when not in use.

AWS Systems Manager (SSM) port forwarding solves this without any of that. The EC2 instance stays in the private subnet. Port 22 never opens. Access is controlled entirely through IAM. The tunnel is an encrypted WebSocket over HTTPS port 443 - no firewall exceptions required beyond what you already have.

## How It Works

SSM Session Manager runs an agent inside the EC2 instance that maintains a persistent outbound WebSocket connection to the SSM service endpoint over HTTPS. When you start a port forwarding session from your local machine, the SSM service stitches your local TCP connection to that WebSocket tunnel, which exits inside the EC2 instance and connects to the RDS endpoint on the specified port.

```
Your laptop (localhost:5433)
    ↕ TCP
AWS SSM Service (HTTPS/443)
    ↕ WebSocket
SSM Agent on EC2 (private subnet)
    ↕ TCP
RDS PostgreSQL (private subnet, port 5432)
```

The EC2 instance is just a relay - it doesn't need to run any application. It needs two things: the SSM agent (pre-installed on Amazon Linux 2023) and an IAM role that allows it to communicate with the SSM service. That's it.

## Prerequisites

**On your local machine:**

```bash
# AWS CLI
brew install awscli

# Session Manager plugin - required for port forwarding
brew install --cask session-manager-plugin
```

Verify the plugin is installed:

```bash
session-manager-plugin --version
```

**IAM permissions** - Your local IAM user or role needs:

```json
{
  "Effect": "Allow",
  "Action": "ssm:StartSession",
  "Resource": [
    "arn:aws:ec2:us-east-1:ACCOUNT_ID:instance/INSTANCE_ID",
    "arn:aws:ssm:us-east-1:*:document/AWS-StartPortForwardingSessionToRemoteHost"
  ]
}
```

Scope the instance ARN to a specific instance ID in production to prevent the permission from being used on arbitrary instances.

## Infrastructure with CDK

The CDK stack needs three things: a VPC with private subnets, an RDS instance in those subnets, and a small EC2 "tunnel instance" with SSM configured.

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_iam as iam,
    RemovalPolicy,
)
from constructs import Construct


class RdsTunnelStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # VPC with private isolated subnets for RDS
        # and private-with-egress subnets for the tunnel instance
        vpc = ec2.Vpc(
            self,
            "Vpc",
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Security group for the tunnel instance
        # No inbound rules - SSM connects outbound
        tunnel_sg = ec2.SecurityGroup(
            self, "TunnelSg", vpc=vpc, description="SSM tunnel instance"
        )

        # Security group for RDS
        # Allows inbound from the tunnel instance only
        rds_sg = ec2.SecurityGroup(
            self, "RdsSg", vpc=vpc, description="RDS PostgreSQL"
        )
        rds_sg.add_ingress_rule(
            peer=tunnel_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from tunnel instance",
        )

        # IAM role for the EC2 instance
        # AmazonSSMManagedInstanceCore is the only policy needed
        tunnel_role = iam.Role(
            self,
            "TunnelRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                )
            ],
        )

        # EC2 tunnel instance
        # t4g.nano is sufficient - it's only forwarding TCP
        ec2.Instance(
            self,
            "TunnelInstance",
            instance_type=ec2.InstanceType("t4g.nano"),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(
                cpu_type=ec2.AmazonLinuxCpuType.ARM_64
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=tunnel_sg,
            role=tunnel_role,
        )

        # RDS PostgreSQL instance in isolated subnets
        rds.DatabaseInstance(
            self,
            "Db",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16
            ),
            instance_type=ec2.InstanceType("t4g.small"),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[rds_sg],
            removal_policy=RemovalPolicy.SNAPSHOT,
            deletion_protection=True,
        )
```

### VPC Endpoints vs. NAT Gateway

The tunnel instance needs to reach the SSM service endpoints to register and maintain its WebSocket connection. Two ways to provide this:

**NAT Gateway** - Route outbound traffic through a NAT Gateway in the public subnet. Simple, but costs ~$32/month just to exist, regardless of traffic.

**VPC Interface Endpoints** - Create three private endpoints directly in your VPC:

```python
# Add to your stack - costs ~$22/month but no NAT required
vpc.add_interface_endpoint(
    "SsmEndpoint",
    service=ec2.InterfaceVpcEndpointAwsService.SSM,
)
vpc.add_interface_endpoint(
    "SsmMessagesEndpoint",
    service=ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
)
vpc.add_interface_endpoint(
    "Ec2MessagesEndpoint",
    service=ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
)
```

VPC endpoints are the better choice for a security-focused setup - traffic to SSM never leaves the AWS network, and there's no internet gateway dependency. If you already have a NAT Gateway for other resources, using it is simpler and there's no additional cost to add SSM access.

## Establishing the Tunnel

Get the tunnel instance ID from the console or CLI:

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=RdsTunnelStack/TunnelInstance" \
  --query "Reservations[*].Instances[*].InstanceId" \
  --output text
```

Start the port forwarding session:

```bash
aws ssm start-session \
  --target i-0abc123def456 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{
    "host": ["your-db.cluster-xyz.us-east-1.rds.amazonaws.com"],
    "portNumber": ["5432"],
    "localPortNumber": ["5433"]
  }'
```

Breaking down the parameters:

- `--target` - the EC2 instance ID acting as the relay
- `--document-name AWS-StartPortForwardingSessionToRemoteHost` - the SSM document that enables remote host forwarding (as opposed to forwarding to the instance itself)
- `host` - the RDS endpoint DNS name (not an IP - DNS resolution happens inside the VPC)
- `portNumber` - the port RDS listens on inside the VPC
- `localPortNumber` - the local port on your machine that maps to it

Once connected, you'll see:

```
Starting session with SessionId: user@example-abc123
Port 5433 opened for sessionId user@example-abc123.
Waiting for connections...
```

Leave this terminal open. The tunnel is active as long as this process runs.

## Connecting with DBeaver

With the tunnel running, configure a new connection in DBeaver:

1. **New Connection** → PostgreSQL
2. **Host:** `localhost`
3. **Port:** `5433` (your `localPortNumber`)
4. **Database:** your database name
5. **Username / Password:** your RDS credentials (stored in Secrets Manager - retrieve with `aws secretsmanager get-secret-value`)

Test the connection - DBeaver connects to `localhost:5433`, which the SSM tunnel forwards through the EC2 instance to RDS at `5432` inside the VPC.

## Running Alembic Migrations

With the tunnel open in one terminal, run migrations in another:

```bash
# Point DATABASE_URL at localhost through the tunnel
export DATABASE_URL="postgresql://dbuser:dbpass@localhost:5433/mydb"

# Run pending migrations
alembic upgrade head
```

Or inline without exporting:

```bash
DATABASE_URL="postgresql://dbuser:dbpass@localhost:5433/mydb" alembic upgrade head
```

If you're pulling credentials from Secrets Manager:

```bash
SECRET=$(aws secretsmanager get-secret-value \
  --secret-id prod/db/credentials \
  --query SecretString \
  --output text)

DB_USER=$(echo $SECRET | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASS=$(echo $SECRET | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5433/mydb" alembic upgrade head
```

To check what migrations are pending before running them:

```bash
DATABASE_URL="postgresql://..." alembic history --indicate-current
DATABASE_URL="postgresql://..." alembic current
```

## IAM and Access Control

SSM access is controlled entirely through IAM - no SSH keys to distribute or rotate. The `ssm:StartSession` permission determines who can open a tunnel.

**Scope access to specific instances:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:StartSession",
      "Resource": [
        "arn:aws:ec2:us-east-1:123456789:instance/i-0abc123def456",
        "arn:aws:ssm:us-east-1:*:document/AWS-StartPortForwardingSessionToRemoteHost"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "ssm:TerminateSession",
      "Resource": "arn:aws:ssm:*:*:session/${aws:username}-*"
    }
  ]
}
```

Attach this policy to a developer IAM role - not to individual users. Developers assume the role to gain tunnel access, and the role assumption itself is auditable in CloudTrail.

**Compared to SSH bastion:**

- No key pairs to create, distribute, or rotate
- No port 22 to open or audit
- Every session is tied to an IAM identity - CloudTrail records who started the session, from which IP, and when
- Revoking access means removing the IAM permission - takes effect immediately with no key revocation process

## Session Logging to CloudWatch

SSM can log all session activity to CloudWatch Logs. Enable it in the SSM console under **Session Manager → Preferences**, or via CDK:

```python
import aws_cdk.aws_ssm as ssm
import aws_cdk.aws_logs as logs

log_group = logs.LogGroup(
    self,
    "SsmSessionLogs",
    retention=logs.RetentionDays.ONE_MONTH,
)

ssm.CfnDocument(
    self,
    "SessionPreferences",
    name="SSM-SessionManagerRunShell",
    document_type="Session",
    content={
        "schemaVersion": "1.0",
        "description": "Session Manager preferences",
        "sessionType": "Standard_Stream",
        "inputs": {
            "cloudWatchLogGroupName": log_group.log_group_name,
            "cloudWatchEncryptionEnabled": True,
            "cloudWatchStreamingEnabled": True,
        },
    },
)
```

This gives you a full audit trail of every tunnel session - useful for compliance and incident investigation.

## The Same Pattern for ECS Fargate

SSM port forwarding works for EC2, but if your workloads are containerized on Fargate, ECS Exec is the equivalent. It uses the same SSM channel to open an interactive shell or run commands inside a running container:

```bash
aws ecs execute-command \
  --cluster my-cluster \
  --task abc123 \
  --container my-container \
  --interactive \
  --command "/bin/bash"
```

Enable it on your ECS task definition with `enable_execute_command=True` in CDK and attach the `ssmmessages:*` permissions to the task role. The same IAM-first, no-open-ports philosophy applies.
