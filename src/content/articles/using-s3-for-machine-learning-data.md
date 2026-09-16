---
title: "Using Amazon S3 for Machine Learning Data and Model Artifacts"
date: 2026-09-15
excerpt: How to organize, version, secure, and retain the datasets and model artifacts that move through an ML pipeline on AWS.
draft: true
tags: ["aws", "s3", "machine-learning", "ml-ops", "data"]
---

An ML pipeline creates more than one dataset. Raw inputs, validated records, training splits, evaluation results, and model artifacts all have different lifecycles. Putting everything into one mutable S3 prefix makes training runs difficult to reproduce and production models difficult to trace.

This article focuses on using S3 as the durable storage layer for an ML system. The goal is to make every training run reproducible without turning the bucket structure into a data platform of its own.

## What S3 Stores in an ML System

- Raw data received from applications, uploads, streams, or external providers.
- Validated and cleaned data produced by processing jobs.
- Curated datasets ready for feature engineering and training.
- Fixed training, validation, and test splits.
- Model artifacts created by training jobs.
- Evaluation reports, metrics, and prediction outputs.
- Metadata that connects a model to its code and source dataset.
- Checkpoints from long-running or interruptible training jobs.

## Organizing Raw, Processed, and Curated Data

- Separate raw, processed, and curated data into clear storage zones.
- Use separate buckets when access policies, retention, or ownership differ significantly.
- Use prefixes when the data shares the same security and lifecycle requirements.
- Keep raw data unchanged so processing mistakes can be corrected later.
- Write transformed data to a new location instead of overwriting its source.
- Quarantine invalid records rather than silently dropping them.
- Document what qualifies data to move from one zone to the next.

```text
s3://ml-data/
├── raw/
├── processed/
├── curated/
├── models/
├── evaluations/
└── predictions/
```

## Designing Object Keys

- Include the dataset name and version in each training-data path.
- Partition large datasets by useful fields such as date, source, or region.
- Keep object keys predictable for processing jobs and human operators.
- Avoid naming a mutable dataset `latest` when a training job depends on it.
- Store temporary uploads outside trusted training-data prefixes.
- Do not place sensitive values such as customer names in object keys.
- Remember that S3 is object storage, even when prefixes resemble directories.

```text
curated/events/version=2026-09-15/part-0001.parquet
models/event-classifier/version=7/model.tar.gz
evaluations/event-classifier/version=7/metrics.json
```

## Making Training Data Reproducible

- Treat every dataset used for training as immutable.
- Give each dataset an explicit version, timestamp, or content-derived identifier.
- Record the exact S3 URI used by every training job.
- Save training, validation, and test splits instead of recreating them randomly.
- Record the random seed and preprocessing configuration.
- Enable S3 Versioning as recovery protection, not as the only dataset-versioning strategy.
- Prevent lifecycle rules from deleting data still referenced by an active model.

## Choosing File Formats

- Use CSV for small datasets and interoperability, not efficient large-scale reads.
- Use JSON Lines when records vary or arrive as independent events.
- Use Parquet for larger tabular datasets and column-oriented processing.
- Compress text formats when network transfer and storage size matter.
- Keep schemas stable within one dataset version.
- Avoid many tiny objects because request overhead slows large processing jobs.
- Combine small records into appropriately sized files during processing.
- Choose formats supported by the training and processing tools that consume them.

## Storing Model Artifacts

- Store trained models separately from source datasets.
- Use immutable object keys for every model version.
- Save preprocessing objects with the model when inference depends on them.
- Store checksums to detect unexpected artifact changes.
- Record the framework and dependency versions required to load the model.
- Restrict write access to trusted training and deployment roles.
- Treat pickle-based model formats as executable content from trusted sources only.
- Keep the previously deployed model available for rollback.

## Connecting Models to Their Data

- Write a manifest for each training run.
- Include the source dataset URI and version.
- Include the source commit and training-container image digest.
- Record hyperparameters, evaluation metrics, and artifact locations.
- Assign a unique training-run identifier.
- Return the model version with production predictions when traceability matters.
- Send approved artifacts to a model registry when formal promotion workflows are needed.

```json
{
  "runId": "run-2026-09-15-001",
  "dataset": "s3://ml-data/curated/events/version=2026-09-15/",
  "sourceCommit": "a1b2c3d",
  "modelArtifact": "s3://ml-data/models/event-classifier/version=7/model.tar.gz",
  "metrics": {
    "accuracy": 0.94
  }
}
```

## Securing ML Data

- Block all public access on ML data buckets.
- Give ingestion, processing, training, and inference separate IAM roles.
- Grant each role access only to the prefixes and actions it needs.
- Encrypt objects with SSE-S3 or AWS KMS based on compliance requirements.
- Restrict access through bucket policies and VPC endpoints where appropriate.
- Log management events with CloudTrail and use data events selectively.
- Use Macie or other discovery controls when buckets may contain sensitive data.
- Define deletion and retention policies for personal or regulated information.

## Versioning, Retention, and Recovery

- Enable bucket versioning to recover from accidental overwrites and deletions.
- Use lifecycle rules to expire temporary uploads and incomplete processing output.
- Transition old datasets and model versions to cheaper storage classes.
- Keep active training data and production model artifacts readily accessible.
- Account for noncurrent versions when estimating storage cost.
- Configure replication only when recovery requirements justify another region.
- Test restoring a dataset or model artifact before relying on the recovery plan.
- Use Object Lock only when retention must be enforced against deletion.

## Connecting S3 to the ML Pipeline

- Use EventBridge or S3 notifications to detect newly uploaded objects.
- Trigger lightweight validation with Lambda.
- Pass S3 URIs through Step Functions instead of moving large payloads between states.
- Let SageMaker training and processing jobs read versioned inputs directly from S3.
- Write model artifacts and evaluation results back to immutable locations.
- Grant inference services read access only to approved model artifacts.
- Make downstream processing idempotent because object events can be delivered more than once.

## Defining the Storage Layer with CDK

- Define encryption, versioning, public-access blocking, and lifecycle rules in code.
- Create separate IAM grants for ingestion, processing, training, and inference.
- Add bucket policies that require encrypted transport.
- Expose bucket names and prefixes through explicit stack outputs or parameters.
- Keep production data buckets protected from stack deletion.
- Add infrastructure assertions for public access and encryption settings.
- Deploy policy changes through reviewed pull requests.

## Cost Considerations

- Storage cost grows through duplicate datasets, model versions, and failed job output.
- Request costs increase when pipelines create or scan many small objects.
- Parquet and partitioning can reduce the amount of data processing jobs read.
- Lifecycle old artifacts only after confirming they are not needed for rollback or audit.
- Use S3 Storage Lens and cost allocation tags to understand usage.
- Avoid cross-region transfer unless availability or compliance requires it.
- Measure the cost of retaining one reproducible training run.

## When Not to Use This Structure

- Keep the layout simpler for experiments with one small dataset and no shared pipeline.
- Use a database when workloads require frequent row-level updates or transactional queries.
- Use a feature store when online and offline features need coordinated serving behavior.
- Avoid separate buckets when prefixes provide enough policy and lifecycle isolation.
- Do not introduce a complex zone model without clear ownership and promotion rules.

## The Takeaway

- S3 is the durable record of the data and artifacts that produced a model.
- Raw data should remain recoverable, while training datasets and model artifacts should be immutable and explicitly versioned.
- Object keys, manifests, schemas, and IAM policies are part of the ML system's contract.
- File format, object size, retention, and access patterns affect both performance and cost.
- Start with clear zones and versioned paths, then add registry and governance controls when the system needs them.
