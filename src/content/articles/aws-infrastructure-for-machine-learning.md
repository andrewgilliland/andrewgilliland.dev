---
title: "AWS Infrastructure for Machine Learning: The Big Picture"
date: 2026-06-28
excerpt: S3, Lambda, SageMaker, Step Functions - here's how the pieces fit together when building ML pipelines on AWS.
draft: true
tags: ["aws", "machine-learning", "ml-ops", "sagemaker", "infrastructure"]
---

Training code is only one part of an ML system. Production infrastructure also has to move data, reproduce training runs, version models, serve predictions, detect problems, and control cost.

This article maps those responsibilities to AWS services. The goal is not to use every service. It is to understand where each piece fits and choose only what the workload needs.

## The ML Pipeline

- Ingest raw data from applications, files, streams, or external systems.
- Store raw data before transforming it so the original input remains recoverable.
- Validate and prepare features for training.
- Train and evaluate candidate models in a reproducible environment.
- Register approved model artifacts and their metadata.
- Deploy a model for real-time or batch inference.
- Monitor infrastructure, prediction quality, and data drift.
- Feed new observations back into a controlled retraining workflow.
- Treat data, code, configuration, and model artifacts as versioned inputs.

## Data Storage with S3

- Use S3 as durable storage for raw data, processed datasets, and model artifacts.
- Separate raw, processed, and curated data with clear prefixes or buckets.
- Use immutable, versioned paths for datasets used by training jobs.
- Enable encryption, versioning, lifecycle rules, and restricted bucket policies.
- Store metadata that connects a model version to its training dataset.
- Use Parquet for larger tabular datasets when columnar reads reduce processing cost.
- Move infrequently accessed artifacts to cheaper storage classes.

## Data Processing with Lambda and Step Functions

- Use Lambda for short validation, routing, metadata, and lightweight transformation tasks.
- Avoid Lambda for processing that exceeds its runtime, memory, or package limits.
- Use Step Functions to coordinate ingestion, preprocessing, training, evaluation, and promotion.
- Make each workflow step retryable and safe to run more than once.
- Add explicit failure paths instead of relying on a chain of implicit triggers.
- Store large payloads in S3 and pass references between workflow states.
- Use Glue, ECS, AWS Batch, or SageMaker Processing for heavier workloads.

## Training with SageMaker

- Run training in isolated, repeatable jobs instead of on a developer laptop.
- Choose CPU or GPU instances based on measured model requirements.
- Read versioned training data from S3 and write artifacts back to S3.
- Package training code and dependencies in a controlled container image.
- Track hyperparameters, metrics, code version, and dataset location for each run.
- Use spot training when interruption tolerance makes the savings worthwhile.
- Stop infrastructure when the training job finishes.
- Keep managed SageMaker features proportional to the team's operational needs.

## Model Registry and Versioning

- Register model artifacts only after evaluation checks pass.
- Associate each model version with metrics, training code, data, and container versions.
- Use statuses such as pending, approved, and rejected to control promotion.
- Require review before production deployment when the model affects important decisions.
- Keep the previous production model available for rollback.
- Separate model approval from model deployment.
- Use SageMaker Model Registry when managed lineage and promotion workflows justify it.

## Inference Endpoints

- Use Lambda for small models, intermittent traffic, and short prediction times.
- Use SageMaker real-time endpoints for larger models or managed autoscaling.
- Use asynchronous endpoints when inference takes longer than an HTTP request should remain open.
- Use batch transform or scheduled jobs when immediate predictions are unnecessary.
- Consider ECS for custom serving stacks or sustained container workloads.
- Validate request schemas before invoking the model.
- Return a model version with predictions for traceability.
- Choose the serving pattern from latency, throughput, model size, and cost requirements.

## Monitoring and Retraining

- Send service logs, latency, errors, and resource metrics to CloudWatch.
- Track model metrics separately from infrastructure health.
- Capture prediction inputs and outcomes only when privacy rules permit it.
- Compare production feature distributions with training data to detect drift.
- Alert on missing data, schema changes, unusual prediction distributions, and latency regressions.
- Trigger retraining from evidence rather than an arbitrary schedule when possible.
- Evaluate a new model before promoting it automatically.
- Keep rollback available when a model degrades after deployment.

## Security and Access

- Give training jobs and endpoints separate IAM roles with least-privilege access.
- Encrypt datasets, artifacts, logs, and endpoint traffic.
- Keep sensitive workloads in private subnets when internet access is unnecessary.
- Store credentials and configuration in Secrets Manager or Parameter Store.
- Avoid placing secrets or sensitive records in workflow inputs and logs.
- Record data access and deployment activity with CloudTrail.
- Define retention and deletion policies for training data and prediction records.
- Treat model artifacts as executable supply-chain inputs that require trusted provenance.

## Putting It All Together with CDK

- Define buckets, roles, workflows, training resources, endpoints, alarms, and outputs as code.
- Split resources into constructs based on ownership and lifecycle rather than AWS service alone.
- Pass bucket names, model locations, and endpoint configuration through explicit interfaces.
- Use separate environments for development, staging, and production.
- Keep production data and permissions isolated from development workloads.
- Deploy infrastructure through GitHub Actions with OIDC and review gates.
- Add assertions or deployment tests for critical security and networking rules.
- Avoid creating permanent expensive resources in every temporary environment.

## Cost Considerations

- S3 is usually inexpensive, but duplicate datasets and retained artifacts accumulate over time.
- Training instance type and duration are often the largest variable costs.
- Use spot instances, checkpoints, and right-sized jobs where interruption is acceptable.
- Real-time endpoints cost money while idle; use serverless, asynchronous, or batch inference when traffic allows.
- Set endpoint autoscaling minimums from actual availability requirements.
- Add cost allocation tags for pipeline, model, environment, and team.
- Configure AWS Budgets and alerts before experimentation grows into production spend.
- Measure cost per training run and cost per prediction instead of only the monthly total.

## When Not to Use This Architecture

- Use a smaller Lambda-based API when one lightweight model and occasional predictions are enough.
- Keep training local when the dataset is small, reproducibility is controlled, and no shared platform is needed.
- Avoid a model registry when a single team can safely version artifacts with simpler tooling.
- Do not build automated retraining until there is a reliable evaluation and approval process.
- Prefer managed platforms when the team cannot own pipeline security, monitoring, and operations.
- Do not adopt every AWS service just because it appears in the reference architecture.

## The Takeaway

- ML infrastructure connects data, training, model promotion, inference, and feedback into one traceable system.
- S3 provides the durable foundation, Step Functions coordinates work, and SageMaker handles managed training and serving where needed.
- Lambda, ECS, batch jobs, and SageMaker endpoints solve different inference problems.
- Monitoring must cover both service health and model behavior.
- Start with the smallest architecture that meets the workload, then add managed ML infrastructure when operational needs justify it.
