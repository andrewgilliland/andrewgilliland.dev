---
title: CI/CD for Lambda Functions with GitHub Actions
date: 2026-03-23
excerpt: Stop running cdk deploy from your laptop. Set up a GitHub Actions pipeline to test and deploy your Lambda functions automatically.
draft: false
---

## Why CI/CD for Serverless?

When I first started deploying Lambda functions, I'd run `cdk deploy` from my laptop. It worked. But it also meant deployments happened whenever I remembered to run them, from whatever branch I happened to be on, with whatever environment variables I had locally.

If you've used Vercel or Netlify, you already know the better way: push to `main`, and your code deploys automatically. GitHub Actions gives you that same workflow for AWS infrastructure.

## What We're Setting Up

By the end of this article, you'll have a GitHub Actions workflow that:

1. Runs on every push to `main`
2. Installs Python and uv
3. Installs your project dependencies
4. Runs your tests
5. Deploys your Lambda functions with CDK

No manual steps. No laptop deploys.

## OIDC vs Access Keys - Authenticating GitHub with AWS

The first question is: how does GitHub Actions talk to your AWS account?

The old way is to create an IAM user, generate access keys, and store them as GitHub secrets. It works, but those keys are long-lived. If they leak, someone has access to your AWS account until you rotate them.

The modern way is **OIDC (OpenID Connect)**. Instead of static keys, GitHub requests a short-lived token from AWS each time the workflow runs. No keys to leak. No secrets to rotate.

Here's how it works:

1. You create an IAM role in AWS that trusts GitHub's OIDC provider
2. Your workflow assumes that role at runtime
3. AWS gives it temporary credentials that expire after the job

## Creating the IAM Role with CDK

Since we're already using CDK, let's define the OIDC provider and IAM role in code. Add this to your CDK stack:

```python
from aws_cdk import Stack, aws_iam as iam
from constructs import Construct

class CiCdStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # Create the OIDC provider for GitHub
        provider = iam.OpenIdConnectProvider(
            self, "GitHubOidc",
            url="https://token.actions.githubusercontent.com",
            client_ids=["sts.amazonaws.com"],
        )

        # Create the role GitHub Actions will assume
        role = iam.Role(
            self, "GitHubActionsRole",
            assumed_by=iam.WebIdentityPrincipal(
                provider.open_id_connect_provider_arn,
                conditions={
                    "StringEquals": {
                        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                    },
                    "StringLike": {
                        "token.actions.githubusercontent.com:sub": "repo:your-username/your-repo:ref:refs/heads/main",
                    },
                },
            ),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AdministratorAccess"),
            ],
        )
```

Replace `your-username/your-repo` with your actual GitHub repo. The `StringLike` condition ensures only pushes to `main` in that repo can assume this role.

> **Note:** `AdministratorAccess` is broad. For production, scope this down to only the permissions CDK needs.

Deploy this stack once from your laptop:

```bash
cdk deploy CiCdStack
```

Copy the role ARN from the output, you'll need it in the workflow file.

## Your First Workflow File

Create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: us-east-1

      - name: Install Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install uv
        uses: astral-sh/setup-uv@v3

      - name: Install dependencies
        run: uv sync

      - name: Run tests
        run: uv run pytest

      - name: Install CDK CLI
        run: npm install -g aws-cdk

      - name: Deploy
        run: uv run cdk deploy --all --require-approval never
```

Replace the role ARN with the one from your CDK stack output.

## Triggering on Push to Main

The `on` block controls when the workflow runs:

```yaml
on:
  push:
    branches: [main]
```

This means: every time code is pushed to `main`, deploy. If you use pull requests, code only reaches `main` after review, so this is your gate.

You can also add a path filter if you only want to deploy when specific files change:

```yaml
on:
  push:
    branches: [main]
    paths:
      - "lambdas/**"
      - "cdk/**"
      - "pyproject.toml"
```

## Installing Python and uv in the Workflow

Two steps handle the Python setup:

```yaml
- name: Install Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.12"

- name: Install uv
  uses: astral-sh/setup-uv@v3
```

The `astral-sh/setup-uv` action installs uv and makes it available for the rest of the job. Then `uv sync` installs everything from your lockfile, just like `npm ci` in a Node project.

## Running Tests Before Deploying

Never deploy without testing first. Add a test step before the deploy:

```yaml
- name: Run tests
  run: uv run pytest
```

If any test fails, the workflow stops. CDK never runs. Your production stays safe.

If you want to run linting too:

```yaml
- name: Lint
  run: uv run ruff check .

- name: Run tests
  run: uv run pytest
```

## Deploying with CDK

The deploy step is straightforward:

```yaml
- name: Deploy
  run: uv run cdk deploy --all --require-approval never
```

`--require-approval never` skips the interactive confirmation prompt. In CI, there's no one to type "y", so you need this flag. The security gate is your PR review process, not a terminal prompt.

`--all` deploys every stack in your CDK app. If you have multiple stacks and want to deploy a specific one:

```yaml
run: uv run cdk deploy MyLambdaStack --require-approval never
```

## Caching Dependencies for Faster Builds

Installing dependencies on every run is slow. Add caching to speed things up:

```yaml
- name: Install uv
  uses: astral-sh/setup-uv@v3
  with:
    enable-cache: true

- name: Install dependencies
  run: uv sync
```

The `enable-cache` option on the uv action caches the uv package cache between runs. If your lockfile hasn't changed, dependencies restore from cache instead of downloading again.

This can cut minutes off your workflow, especially when you have heavy dependencies like `pandas` or `boto3`.

## Deploying to Staging vs Production

As your project grows, you'll want separate environments. One approach: use branch-based deployments.

```yaml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set environment
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "ENV=production" >> $GITHUB_ENV
          else
            echo "ENV=staging" >> $GITHUB_ENV
          fi

      - name: Deploy
        run: uv run cdk deploy --all --require-approval never --context env=${{ env.ENV }}
```

Then in your CDK code, read the context value to configure different settings per environment, different Lambda memory, different DynamoDB table names, whatever you need.

## What Happens When a Deploy Fails

CDK uses CloudFormation under the hood, and CloudFormation has built-in rollback. If a deployment fails halfway through, it automatically rolls back to the previous working state.

In your GitHub Actions workflow, a failed deploy means:

1. CloudFormation rolls back the stack
2. The workflow step exits with a non-zero code
3. GitHub marks the job as failed
4. You get a notification (if you've set that up)

To debug, check two places:

- **GitHub Actions logs** - shows the CDK output and error messages
- **CloudFormation console** - shows exactly which resource failed and why

One gotcha: if your Lambda code deploys successfully but has a runtime bug, CloudFormation won't catch that. It only checks that resources were created, not that your code works. That's what your test step is for.

## The Takeaway

Setting up CI/CD for Lambda functions isn't much different from what you'd do for a Vercel or Netlify project, push to `main`, let the pipeline handle the rest. OIDC keeps the auth secure, uv keeps the installs fast, and CDK gives you repeatable deployments. Once this is in place, you'll never want to go back to deploying from your laptop.
