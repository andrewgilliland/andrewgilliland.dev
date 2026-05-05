---
title: Lambda with RDS Proxy
date: 2026-05-05
excerpt: Why Lambda exhausts RDS connection limits under load, and how to fix it with RDS Proxy - including CDK setup, IAM auth, and connection reuse.
draft: false
tags: ["aws", "serverless", "python", "cdk", "rds"]
---

Lambda functions are stateless and short-lived. A relational database is neither. Every Lambda invocation that needs a database has to open a connection, use it, and close it - or leave it open and hope the execution environment is reused. At low concurrency that works fine. Under load, it falls apart: connections pile up faster than they close, and PostgreSQL starts rejecting new ones with `FATAL: remaining connection slots are reserved`.

RDS Proxy sits between Lambda and RDS and solves this. It maintains a warm pool of connections to the database and multiplexes Lambda requests through them. Lambda thinks it's talking directly to Postgres. Postgres sees a small, stable number of connections from the proxy. This article walks through the problem in detail, then sets up the full solution in CDK with IAM auth and proper connection reuse.

## The Connection Problem

When a Lambda function connects to RDS, it opens a TCP connection and authenticates. On a warm invocation, that connection may still be open from the previous call - but only if it's the same execution environment. Lambda can run hundreds of concurrent executions across many environments, each with its own connection.

PostgreSQL limits total connections based on the `max_connections` setting, which defaults to a value derived from instance memory:

| Instance       | Approx. `max_connections` |
| -------------- | ------------------------- |
| `db.t3.micro`  | ~90                       |
| `db.t3.small`  | ~150                      |
| `db.t3.medium` | ~300                      |
| `db.r6g.large` | ~1,000                    |

A `db.t3.micro` can only hold ~90 connections. If you have 90 concurrent Lambda invocations each holding a connection, the 91st gets: `FATAL: sorry, too many clients already`. Lambda retries, which makes it worse. The database becomes unreachable.

Upsizing the instance to get more connections is expensive and doesn't scale - at high enough concurrency you'll hit limits on any instance size. The right fix is a connection pooler.

## What RDS Proxy Does

RDS Proxy is a fully managed connection pooler that AWS runs in your VPC. Lambda connects to the proxy endpoint instead of the RDS endpoint. The proxy maintains a pool of long-lived connections to the database and routes Lambda requests through them.

**Multiplexing** is how the proxy achieves this. If Lambda connection A and Lambda connection B are not inside a transaction, the proxy can route both through the same underlying database connection sequentially. From Lambda's perspective, both have a connection. From Postgres's perspective, there's one connection doing two things.

**Connection pinning** is when multiplexing can't happen. If a Lambda connection uses a transaction, a prepared statement, or certain session-level settings (`SET`, temp tables), the proxy pins that Lambda to a dedicated database connection for the duration of the session. Pinning isn't a bug - it's correct behavior - but excessive pinning reduces the proxy's effectiveness. Avoid long-running transactions in Lambda handlers and avoid `SET` commands at the session level.

RDS Proxy also integrates with IAM authentication and AWS Secrets Manager. Lambda can authenticate to the proxy using a short-lived IAM token instead of a static password, and the proxy handles rotating the underlying RDS credentials from Secrets Manager without any application changes.

## VPC Requirements

RDS Proxy runs inside your VPC. Lambda must also run inside the same VPC to reach the proxy endpoint. This is where most setups go wrong.

You need three security groups and two rules:

- **Lambda SG** → allow outbound to **Proxy SG** on port 5432
- **Proxy SG** → allow inbound from **Lambda SG** on port 5432
- **Proxy SG** → allow outbound to **RDS SG** on port 5432
- **RDS SG** → allow inbound from **Proxy SG** on port 5432

Lambda → Proxy → RDS. Each hop needs explicit permission in both directions.

VPC-attached Lambda also loses internet access by default. If your function needs to call AWS services (S3, SSM, Secrets Manager), add VPC endpoints for those services or attach a NAT gateway. For this setup, the only AWS API calls are to `rds` for generating the IAM auth token, so a VPC endpoint for `rds` is sufficient.

## CDK Setup

Here's the full stack: a VPC, a PostgreSQL RDS instance, a Secrets Manager secret for the RDS password, an RDS Proxy with IAM auth enabled, and a Lambda function in the VPC with the right permissions.

```typescript
// lib/proxy-stack.ts
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class ProxyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
    });

    // Security groups
    const lambdaSg = new ec2.SecurityGroup(this, "LambdaSg", { vpc });
    const proxySg = new ec2.SecurityGroup(this, "ProxySg", { vpc });
    const rdsSg = new ec2.SecurityGroup(this, "RdsSg", { vpc });

    proxySg.addIngressRule(lambdaSg, ec2.Port.tcp(5432));
    rdsSg.addIngressRule(proxySg, ec2.Port.tcp(5432));

    // RDS credentials in Secrets Manager
    const dbSecret = new secretsmanager.Secret(this, "DbSecret", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "postgres" }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    // PostgreSQL RDS instance
    const db = new rds.DatabaseInstance(this, "Db", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [rdsSg],
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: "appdb",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS Proxy
    const proxy = new rds.DatabaseProxy(this, "Proxy", {
      proxyTarget: rds.ProxyTarget.fromInstance(db),
      secrets: [dbSecret],
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [proxySg],
      iamAuth: true,
      requireTLS: true,
    });

    // Lambda function
    const fn = new lambda.Function(this, "Handler", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "handler.main",
      code: lambda.Code.fromAsset("lambda"),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSg],
      environment: {
        PROXY_ENDPOINT: proxy.endpoint,
        DB_NAME: "appdb",
        DB_USER: "postgres",
        AWS_REGION_NAME: this.region,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant IAM auth to the proxy
    proxy.grantConnect(fn, "postgres");

    new cdk.CfnOutput(this, "ProxyEndpoint", { value: proxy.endpoint });
  }
}
```

A few things worth explaining:

**`iamAuth: true`** enables IAM-based authentication on the proxy. Lambda will generate a short-lived token instead of using the static password. The proxy validates the token against IAM and then connects to RDS using the credentials from Secrets Manager - Lambda never sees the actual password.

**`proxy.grantConnect(fn, "postgres")`** adds an IAM policy to the Lambda execution role allowing `rds-db:connect` for the `postgres` database user on this proxy. Without this, the IAM token generation will succeed but the proxy will reject the connection.

**`natGateways: 0`** keeps costs down. The Lambda and RDS are both in private isolated subnets. If your Lambda needs internet access, add a NAT gateway or use VPC endpoints for each AWS service it calls.

**`requireTLS: true`** enforces TLS on the proxy connection. Match this in the Lambda connection string with `sslmode=require`.

## The Lambda Handler

Lambda connects to the proxy using an IAM auth token. The token is generated with `boto3` and used as the password in the `psycopg2` connection string. Tokens are valid for 15 minutes, so you need to handle token expiry on reconnection.

```python
# lambda/handler.py
import os
import time
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

PROXY_ENDPOINT = os.environ["PROXY_ENDPOINT"]
DB_NAME = os.environ["DB_NAME"]
DB_USER = os.environ["DB_USER"]
REGION = os.environ["AWS_REGION_NAME"]
PORT = 5432

_conn = None
_token_expiry = 0


def get_auth_token() -> str:
    client = boto3.client("rds", region_name=REGION)
    return client.generate_db_auth_token(
        DBHostname=PROXY_ENDPOINT,
        Port=PORT,
        DBUsername=DB_USER,
        Region=REGION,
    )


def get_connection():
    global _conn, _token_expiry

    # Refresh token before it expires (tokens last 15 minutes)
    now = time.time()
    if _conn is None or now >= _token_expiry:
        if _conn is not None:
            try:
                _conn.close()
            except Exception:
                pass

        token = get_auth_token()
        _token_expiry = now + 840  # 14 minutes - refresh before the 15-min expiry

        _conn = psycopg2.connect(
            host=PROXY_ENDPOINT,
            port=PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=token,
            sslmode="require",
            connect_timeout=5,
            cursor_factory=RealDictCursor,
        )
        _conn.autocommit = True

    return _conn


def main(event, context):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, created_at FROM users LIMIT 10")
        rows = cur.fetchall()

    return {
        "statusCode": 200,
        "body": str(rows),
    }
```

**`_conn` at module level** is the key pattern. Lambda reuses execution environments across warm invocations, so a connection opened at module level persists. Each warm invocation calls `get_connection()`, finds `_conn` already open, and skips reconnection entirely - the connection is shared across calls in the same environment.

**Token expiry handling** is necessary because IAM tokens last 15 minutes. The `_token_expiry` check refreshes the token (and the connection) before it expires. Without this, the connection will start failing mid-deployment when the token lapses.

**`autocommit = True`** avoids implicit transactions. Without it, psycopg2 wraps every query in a transaction by default, which causes connection pinning on the proxy. With `autocommit`, single queries don't start transactions and the proxy can multiplex freely.

## psycopg2 on Lambda

`psycopg2` requires compiled C extensions. The standard `pip install psycopg2` won't work on Lambda - you need either `psycopg2-binary` (bundled binaries, fine for Lambda) or a Lambda layer.

Using a Lambda layer from the community:

```typescript
const psycopg2Layer = lambda.LayerVersion.fromLayerVersionArn(
  this,
  "Psycopg2Layer",
  `arn:aws:lambda:${this.region}:898466741470:layer:psycopg2-py311:1`,
);

const fn = new lambda.Function(this, "Handler", {
  // ...
  layers: [psycopg2Layer],
});
```

Or bundle it yourself with Docker to match the Lambda execution environment:

```bash
mkdir -p layer/python
docker run --rm \
  -v "$PWD/layer:/layer" \
  public.ecr.aws/lambda/python:3.13 \
  pip install psycopg2-binary -t /layer/python
```

Then reference the local layer in CDK:

```typescript
const psycopg2Layer = new lambda.LayerVersion(this, "Psycopg2Layer", {
  code: lambda.Code.fromAsset("layer"),
  compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
});
```

## Observability

RDS Proxy publishes metrics to CloudWatch under the `AWS/RDS` namespace with a `ProxyName` dimension. The most useful ones:

| Metric                          | What It Tells You                                               |
| ------------------------------- | --------------------------------------------------------------- |
| `DatabaseConnections`           | Current open connections from proxy to RDS                      |
| `ClientConnections`             | Current open connections from Lambda to proxy                   |
| `MaxDatabaseConnectionsAllowed` | The proxy's computed limit based on RDS `max_connections`       |
| `QueryDuration`                 | p50/p99 query time at the proxy layer                           |
| `ConnectionBorrowTimeout`       | Requests that waited too long to get a connection from the pool |
| `Pinned`                        | Percentage of sessions that are pinned (can't be multiplexed)   |

Watch `ClientConnections` vs `DatabaseConnections` to confirm the proxy is multiplexing. A healthy setup shows many client connections mapping to far fewer database connections. If both numbers track each other closely, the proxy isn't helping - usually because of connection pinning.

High `Pinned` percentage means something in the Lambda code is preventing multiplexing. The most common cause is forgetting `autocommit = True`. Check for any `SET` commands, explicit `BEGIN` blocks, or use of temporary tables.

## When You Don't Need It

RDS Proxy adds cost and complexity. Skip it when:

- **Concurrency is low and predictable.** A scheduled Lambda that runs once a minute with a single invocation has no connection pressure. The proxy's overhead isn't worth it.
- **You're using Aurora Serverless v2.** Aurora Serverless v2 has built-in connection handling that scales more gracefully than standard RDS. It still benefits from a proxy at very high concurrency, but the urgency is lower.
- **It's a development or staging environment.** Proxy has a minimum cost even at zero traffic. Use a direct connection for non-production environments and only introduce the proxy in production.
- **Your workload is DynamoDB or another non-relational store.** The connection problem is specific to relational databases. DynamoDB uses HTTP - there are no persistent connections to exhaust.

## The Takeaway

- **Lambda's connection model breaks relational databases at scale.** Each execution environment opens its own connection. Under high concurrency, you hit `max_connections` and the database starts refusing connections.
- **RDS Proxy multiplexes many Lambda connections through a smaller pool of database connections.** Lambda sees a reliable connection endpoint. Postgres sees a stable, bounded number of connections.
- **Connection pinning limits multiplexing.** Set `autocommit = True`, avoid session-level `SET` commands, and keep transactions short. High `Pinned` metrics are a signal to check these.
- **The Lambda + VPC requirement is the most common setup mistake.** Both Lambda and RDS Proxy must be in the same VPC. Security groups need explicit rules for each hop: Lambda → Proxy → RDS.
- **IAM auth is the right authentication pattern.** `proxy.grantConnect()` in CDK adds the `rds-db:connect` permission. Lambda generates a token with `generate_db_auth_token` and uses it as the password. No static credentials in environment variables.
- **Module-level connections persist across warm invocations.** Open `_conn` once at module scope, check it at the top of each invocation, and refresh it before the 15-minute IAM token expiry.

For the full API layer on top of Lambda and Postgres, [Building a REST API with API Gateway and Lambda](/articles/building-a-rest-api-with-api-gateway-and-lambda) covers routing, CDK wiring, and response shaping. For a comparison of RDS and Aurora to help choose the right database engine before adding a proxy, [AWS RDS vs Aurora](/articles/aws-rds-vs-aurora) covers the tradeoffs.
