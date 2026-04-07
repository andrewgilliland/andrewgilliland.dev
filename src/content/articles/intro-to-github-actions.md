---
title: "Intro to GitHub Actions"
date: 2026-04-06
excerpt: GitHub Actions is CI/CD built directly into GitHub. No external service to configure. Push code, merge a PR, cut a release - automation runs. Here's what it is, how workflows are structured, and real examples for the most common use cases.
draft: false
---

## What Is GitHub Actions?

GitHub Actions is an automation platform built into GitHub. You define workflows in YAML files, GitHub runs them on its own servers, and you pay nothing for public repositories. For private repos, you get 2,000 free minutes per month and pay per minute after that.

The core idea: automation triggers when something happens in your repository. A push, a pull request, a merged commit, a new release, a manual button click, or a schedule. When the trigger fires, GitHub spins up a fresh virtual machine, runs your steps in order, and tears it down when they're done.

No external CI/CD service to configure. No webhooks to wire up. The workflow lives in your repo alongside your code.

## What GitHub Actions Can Do

**Test your code automatically.** Every pull request runs your test suite before it can be merged. No more "it worked on my machine."

**Deploy on merge.** Push to `main`, and your code deploys to AWS, Vercel, a server - wherever. No manual steps, no laptop deploys.

**Enforce code quality.** Run linters, formatters, and type checkers on every push. Fail the workflow if the code doesn't meet the standard.

**Build and publish artifacts.** Build a Docker image and push it to ECR. Build a Python package and publish it to PyPI. Build a Node package and publish it to npm.

**Run database migrations as part of deploy.** Apply schema changes to your database automatically when you deploy new code.

**Schedule recurring work.** Run a Python script every night at midnight. Generate a weekly report. Ping a health check endpoint on a schedule.

**Automate anything with a CLI.** If you can run it in a terminal, you can run it in GitHub Actions.

## Common Terms

| Term            | What It Is                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workflow**    | A YAML file in `.github/workflows/` that defines automated behavior. A repo can have multiple workflows.                                          |
| **Event**       | What triggers the workflow to run: `push`, `pull_request`, `schedule`, `release`, `workflow_dispatch` (manual), and more.                         |
| **Job**         | A group of steps that run together on a single runner. Multiple jobs in a workflow run in parallel by default.                                    |
| **Step**        | A single unit of work inside a job - either a shell command (`run`) or a reusable action (`uses`).                                                |
| **Runner**      | The virtual machine that executes a job. GitHub provides `ubuntu-latest`, `macos-latest`, and `windows-latest`.                                   |
| **Action**      | A reusable, packaged unit of automation from the GitHub Marketplace or your own repo. `actions/checkout` and `actions/setup-python` are examples. |
| **Secret**      | An encrypted value stored in GitHub Settings. Exposed to workflows as environment variables. Never appears in logs.                               |
| **Environment** | A named deployment target (dev, staging, prod) with its own secrets and optional protection rules (required reviewers, wait timers).              |
| **Matrix**      | A strategy that runs the same job across multiple configurations (Python versions, OS, etc.) in parallel.                                         |
| **Artifact**    | A file or directory produced by a job that can be passed to a later job or downloaded after the run.                                              |
| **Context**     | Built-in variables like `github.sha`, `github.ref`, `github.actor` that provide information about the current run.                                |

## Anatomy of a Workflow File

Every workflow is a YAML file inside `.github/workflows/`. Here's a complete, annotated example:

```yaml
# .github/workflows/ci.yml

name: CI # displayed in the GitHub Actions UI

on: # what triggers this workflow
  push:
    branches: [main]
  pull_request:
    branches: [main]

env: # environment variables available to all jobs
  PYTHON_VERSION: "3.13"

jobs:
  test: # job ID - used to reference this job from other jobs
    name: Run Tests # display name in the UI
    runs-on: ubuntu-latest # the runner OS

    steps:
      - name: Checkout code
        uses: actions/checkout@v4 # clone the repo onto the runner

      - name: Set up Python
        uses: actions/setup-python@v5
        with: # inputs passed to the action
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install uv
        uses: astral-sh/setup-uv@v5

      - name: Install dependencies
        run: uv sync # shell command

      - name: Run tests
        run: uv run pytest
        env: # environment variables scoped to this step
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

**Key things to know:**

- `on` is where you define triggers. Multiple events, specific branches, or path filters are all supported.
- `uses` pulls in a reusable action by name and version tag. Always pin to a version tag (`@v4`), not `@main`.
- `run` executes a shell command. Multi-line commands use `|`.
- `${{ secrets.NAME }}` injects a secret. It's redacted in logs automatically.
- `${{ env.NAME }}` injects an environment variable defined at the workflow level.
- Steps within a job run sequentially. Jobs within a workflow run in parallel unless you use `needs`.

## Use Case Examples

### Lint and Type Check on Push

Run `ruff` for linting and `mypy` for type checking on every push. Fails the workflow if anything doesn't pass.

```yaml
# .github/workflows/lint.yml
name: Lint

on:
  push:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"

      - uses: astral-sh/setup-uv@v5

      - run: uv sync

      - name: Lint with ruff
        run: uv run ruff check .

      - name: Type check with mypy
        run: uv run mypy .
```

### Run Tests on Pull Request

Run the full test suite whenever a PR targets `main`. Block merge until it passes.

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"

      - uses: astral-sh/setup-uv@v5

      - run: uv sync

      - name: Run tests
        run: uv run pytest --tb=short
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

To require this check before merging, go to your repo's **Settings → Branches → Branch protection rules** and add the job name as a required status check.

### Run Database Migrations on Deploy

Apply Alembic migrations against Aurora before deploying new app code. The migration step runs first — if it fails, the deploy doesn't proceed.

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"

      - uses: astral-sh/setup-uv@v5

      - run: uv sync

      - name: Run migrations
        run: uv run alembic upgrade head
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}

  deploy:
    runs-on: ubuntu-latest
    needs: migrate # only runs if migrate succeeds
    steps:
      - run: echo "Deploy your app here"
```

`needs: migrate` creates a dependency — the `deploy` job won't start until `migrate` completes successfully.

### Deploy Lambda to AWS

Authenticate with AWS via OIDC and update a Lambda function's code on every push to `main`. See [CI/CD for Lambda Functions with GitHub Actions](/articles/ci-cd-for-lambda-functions-with-github-actions) for the full OIDC setup with CDK.

```yaml
# .github/workflows/deploy-lambda.yml
name: Deploy Lambda

on:
  push:
    branches: [main]

permissions:
  id-token: write # required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"

      - uses: astral-sh/setup-uv@v5

      - run: uv sync

      - name: Deploy with CDK
        run: uv run cdk deploy --require-approval never
```

### Deploy Static Site to S3

Build a static site and sync the output to an S3 bucket. Pairs with a CloudFront invalidation to flush the CDN cache.

```yaml
# .github/workflows/deploy-site.yml
name: Deploy Site

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

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Install dependencies and build
        run: |
          npm ci
          npm run build

      - name: Sync to S3
        run: aws s3 sync ./dist s3://${{ secrets.S3_BUCKET }} --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} \
            --paths "/*"
```

`--delete` removes files from S3 that no longer exist in `./dist`. The CloudFront invalidation ensures users get the new files immediately instead of waiting for the cache TTL to expire.

### Build and Push Docker Image to ECR

Build a Docker image and push it to Amazon ECR on every push to `main`. A downstream deploy job (ECS, Lambda container, etc.) can then pull the new image.

```yaml
# .github/workflows/build-push-ecr.yml
name: Build and Push to ECR

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Log in to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          REPOSITORY: my-app
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $REGISTRY/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REPOSITORY:$IMAGE_TAG
```

`github.sha` is the full commit SHA — using it as the image tag means every image is traceable to a specific commit and tags never collide.

### Publish to PyPI

Build a Python package and publish it to PyPI when a GitHub release is created. Uses PyPI's Trusted Publisher feature (OIDC) instead of an API token.

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published] # triggers when a release is published on GitHub

permissions:
  id-token: write # required for PyPI trusted publisher

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: pypi # optional: gate on a named environment
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"

      - uses: astral-sh/setup-uv@v5

      - name: Build the package
        run: uv build

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
```

Set up the Trusted Publisher in your PyPI project settings first — add GitHub as a publisher with your repo name, workflow filename, and environment name. No API token needed.

### Scheduled Cron Job

Run a Python script on a repeating schedule. Useful for nightly data syncs, cleanup jobs, health checks, or report generation.

```yaml
# .github/workflows/nightly.yml
name: Nightly Job

on:
  schedule:
    - cron: "0 0 * * *" # every day at midnight UTC
  workflow_dispatch: # also allow manual trigger from the UI

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"

      - uses: astral-sh/setup-uv@v5

      - run: uv sync

      - name: Run nightly script
        run: uv run python scripts/nightly_sync.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
```

Cron syntax is standard Unix cron, in UTC. `workflow_dispatch` adds a manual "Run workflow" button in the GitHub Actions UI so you can trigger it without waiting for the schedule. Always add `workflow_dispatch` to scheduled workflows — you'll want it when debugging.

## The Takeaway

- **GitHub Actions lives in your repo.** Workflows are YAML files in `.github/workflows/` — versioned alongside your code, reviewable in PRs, no external service to configure.
- **Use OIDC for AWS authentication, not access keys.** OIDC issues short-lived credentials per run. No long-lived keys to rotate or accidentally leak.
- **Pin action versions to a tag, not `@main`.** `actions/checkout@v4` is stable. `actions/checkout@main` can break without warning.
- **Use `needs` to sequence jobs.** Jobs run in parallel by default. Add `needs: job-id` to create dependencies — migrate before deploy, build before push.
- **Secrets are automatically redacted in logs.** Never echo them explicitly, but don't worry about them appearing in normal command output.
- **Always add `workflow_dispatch` to scheduled workflows.** It gives you a manual trigger button in the UI, which you'll need when testing or debugging the workflow.
- **Keep workflows focused.** A lint workflow, a test workflow, and a deploy workflow are easier to reason about and faster to debug than one monolithic workflow that does everything.
