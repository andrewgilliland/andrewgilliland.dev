---
title: Environment Variables, Secrets, and SSM Parameter Store
date: 2026-04-29
excerpt: Hardcoded config doesn't scale and hardcoded secrets are a security incident waiting to happen. Here's how to manage environment variables, secrets, and configuration for Lambda functions on AWS - from local development to production.
draft: false
---

## The Problem with Hardcoded Config

At some point every developer writes something like this:

```python
DB_PASSWORD = "mysecretpassword"
API_KEY = "sk-live-abc123"
ENVIRONMENT = "production"
```

It works locally. It works in the first deploy. Then you commit it to a public repo by accident, or need to rotate the key, or want to run the same code against staging instead of production, and suddenly you have a problem.

The right model is to separate config from code. Code is deployed once and runs everywhere. Config varies by environment and should never be in version control. Secrets are a stricter version of config - they need to be encrypted at rest, access-controlled, and auditable.

AWS gives you three tools for this:

- **Lambda environment variables** - non-sensitive config that varies by environment (region, table names, feature flags)
- **AWS Secrets Manager** - database credentials, API keys, anything that needs rotation and fine-grained access control
- **SSM Parameter Store** - a lower-cost alternative for config values and non-critical secrets

## Environment Variables in Lambda

Lambda natively supports environment variables. They're set on the function at deploy time and injected into the execution environment - your code reads them at runtime with `os.environ`.

```python
import os

TABLE_NAME = os.environ["TABLE_NAME"]
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
```

Use `os.environ["KEY"]` (raises `KeyError` if missing) for required variables and `os.environ.get("KEY", "default")` for optional ones with fallbacks. This distinction makes it obvious at startup whether a required value is misconfigured.

### Setting Env Vars with CDK

```python
from aws_cdk import aws_lambda as lambda_

fn = lambda_.Function(
    self,
    "MyFunction",
    runtime=lambda_.Runtime.PYTHON_3_12,
    handler="handler.main",
    code=lambda_.Code.from_asset("lambda"),
    environment={
        "TABLE_NAME": table.table_name,
        "ENVIRONMENT": "production",
    },
)
```

Reference other CDK constructs directly - `table.table_name`, `bucket.bucket_name`, `queue.queue_url` - rather than hardcoding values. CDK resolves them to the correct ARN or name at synth time, so your code is always pointing at the right resource regardless of the stack name or account.

Lambda environment variables are encrypted at rest using the function's KMS key (AWS-managed by default). For non-secret configuration this is sufficient. For actual secrets - credentials, tokens, API keys - environment variables aren't the right tool. If someone gains access to the function configuration in the console or via `aws lambda get-function-configuration`, they can read every environment variable in plaintext.

## What Belongs in a Secret?

A useful rule of thumb:

| Config type                                      | Where it belongs            |
| ------------------------------------------------ | --------------------------- |
| Feature flags, resource names, region, log level | Lambda environment variable |
| Third-party API keys, auth tokens                | Secrets Manager             |
| Database credentials                             | Secrets Manager             |
| Internal config shared across services           | SSM Parameter Store         |
| Certificates, private keys                       | Secrets Manager             |

If rotating the value would require redeploying your function, it's misconfigured. Secrets Manager and SSM let you update values without touching the function. Your code fetches the current value at runtime.

## Using AWS Secrets Manager

Secrets Manager stores secrets as JSON strings. The typical pattern for database credentials:

```json
{
  "username": "dbuser",
  "password": "abc123xyz",
  "host": "my-db.cluster-xyz.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "mydb"
}
```

Fetching the secret from Python using `boto3`:

```python
import boto3
import json

def get_secret(secret_name: str) -> dict:
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

secret = get_secret("prod/myapp/db")
conn = psycopg2.connect(
    host=secret["host"],
    port=secret["port"],
    dbname=secret["dbname"],
    user=secret["username"],
    password=secret["password"],
)
```

### Granting Access with CDK

Your Lambda function needs `secretsmanager:GetSecretValue` permission on the secret. The CDK shorthand:

```python
from aws_cdk import aws_secretsmanager as secretsmanager

secret = secretsmanager.Secret(self, "DbSecret")

# Grant read access and inject the secret ARN as an env var
secret.grant_read(fn)
fn.add_environment("DB_SECRET_ARN", secret.secret_arn)
```

`grant_read()` adds a least-privilege IAM policy to the function's role - no manually written IAM statements needed.

## Using SSM Parameter Store

SSM Parameter Store has two tiers: **Standard** (free, up to 4KB per value) and **Advanced** (paid, up to 8KB, supports parameter policies). For most use cases, Standard is sufficient.

Parameter types:

- `String` - plaintext value
- `SecureString` - encrypted with KMS, decrypted on retrieval
- `StringList` - comma-separated list

Fetching a parameter from Python:

```python
import boto3

def get_parameter(name: str) -> str:
    client = boto3.client("ssm")
    response = client.get_parameter(Name=name, WithDecryption=True)
    return response["Parameter"]["Value"]

api_key = get_parameter("/myapp/prod/third-party-api-key")
```

`WithDecryption=True` is required for `SecureString` parameters. It's safe to always pass it - for plaintext parameters it has no effect.

### Granting Access with CDK

```python
from aws_cdk import aws_ssm as ssm

param = ssm.StringParameter(
    self,
    "ApiKey",
    parameter_name="/myapp/prod/third-party-api-key",
    string_value="placeholder",  # update manually or via CI
)

# Grant read access and inject the parameter name as an env var
param.grant_read(fn)
fn.add_environment("API_KEY_PARAM", param.parameter_name)
```

Your function reads the parameter name from the environment variable and uses it to fetch the current value at runtime - so rotating the value in SSM takes effect on the next invocation with no redeployment.

## Caching Secrets in Lambda

Fetching a secret from Secrets Manager or SSM on every invocation adds latency (typically 10–50ms) and API costs. Lambda execution environments are reused across warm invocations, so module-level variables persist between calls in the same environment.

```python
import boto3
import json
import time

_secret_cache: dict | None = None
_secret_fetched_at: float = 0
_CACHE_TTL = 300  # 5 minutes

def get_db_secret() -> dict:
    global _secret_cache, _secret_fetched_at

    now = time.time()
    if _secret_cache is None or (now - _secret_fetched_at) > _CACHE_TTL:
        client = boto3.client("secretsmanager")
        response = client.get_secret_value(
            SecretId=os.environ["DB_SECRET_ARN"]
        )
        _secret_cache = json.loads(response["SecretString"])
        _secret_fetched_at = now

    return _secret_cache

def handler(event, context):
    secret = get_db_secret()  # fetches on cold start or after TTL, cached otherwise
    ...
```

The TTL matters: if you rotate a secret, Lambda execution environments will pick up the new value within `_CACHE_TTL` seconds. Set it based on your rotation frequency - 5 minutes is a reasonable default that balances performance against rotation lag.

A cold start always fetches fresh. A warm invocation within the TTL window uses the cached value. This keeps the common path fast without pinning to a potentially stale secret indefinitely.

## Local Development

Lambda reads env vars from `os.environ`. Locally, you need those same vars available without committing real values to the repo.

The standard pattern:

```bash
pip install python-dotenv
```

Create a `.env` file (add to `.gitignore` immediately):

```bash
TABLE_NAME=my-local-table
ENVIRONMENT=development
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:dev/myapp/db-abc123
```

Load it at the top of your handler or app entrypoint:

```python
from dotenv import load_dotenv
load_dotenv()  # no-op if running in Lambda (no .env file present)
```

`load_dotenv()` only sets variables that aren't already set - so in Lambda, where the runtime has already injected the real env vars, it does nothing. Locally, it populates from `.env`.

For secrets during local development, use a separate dev secret in Secrets Manager with non-production credentials, or mock the fetch with a local `.env` value that bypasses the SDK call:

```python
import os

def get_db_secret() -> dict:
    # Allow fully local development without hitting AWS
    if os.environ.get("LOCAL_DB_PASSWORD"):
        return {
            "host": os.environ.get("LOCAL_DB_HOST", "localhost"),
            "port": int(os.environ.get("LOCAL_DB_PORT", "5432")),
            "username": os.environ.get("LOCAL_DB_USER", "postgres"),
            "password": os.environ["LOCAL_DB_PASSWORD"],
            "dbname": os.environ.get("LOCAL_DB_NAME", "mydb"),
        }
    # Production path: fetch from Secrets Manager
    ...
```

## Secrets Manager vs Parameter Store

|                          | Secrets Manager                                       | SSM Parameter Store                                       |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------- |
| **Cost**                 | $0.40/secret/month + $0.05 per 10K API calls          | Free (Standard tier)                                      |
| **Built-in rotation**    | Yes - native rotation with Lambda                     | No                                                        |
| **Max value size**       | 65KB                                                  | 4KB (Standard), 8KB (Advanced)                            |
| **Cross-account access** | Yes, via resource policy                              | Limited                                                   |
| **Best for**             | Database credentials, API keys, anything that rotates | Config values, feature flags, shared non-sensitive config |

Use Secrets Manager for anything that rotates or needs cross-account sharing. Use SSM Parameter Store for configuration that changes infrequently and doesn't require rotation. If cost is a concern and you have many parameters, SSM Standard at zero cost beats Secrets Manager at $0.40 per secret per month.

When in doubt: if it's a password or a key, use Secrets Manager. If it's a config value that happens to be sensitive, SSM SecureString is fine.
