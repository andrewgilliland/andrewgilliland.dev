---
title: "Amazon S3: What It Is, What It's For, and How to Deploy It with CDK"
date: 2026-03-31
excerpt: S3 is AWS's object storage service - store any file at any scale. Here's what it is, what it's built for, what it isn't, what it works with, and how to deploy it with CDK.
draft: false
tags: ["aws", "cdk"]
---

## What Is Amazon S3?

S3 (Simple Storage Service) is AWS's object storage service. You store files - any file - in a bucket, and S3 handles the rest. Replication, durability, scaling, access control. You don't manage disks, RAID arrays, or storage servers. You just put files in and get files out.

The model is simple: a **bucket** is a globally unique namespace container. An **object** is a file plus its metadata. An **key** is the full identifier for an object within a bucket - something like `images/profile/avatar.png`. That `/` in the key isn't a real directory separator. S3 has no directory hierarchy. The slash is a convention that tools use to render a folder structure, but underneath it's all flat key-value storage.

A few things worth knowing upfront:

- **99.999999999% (11 nines) durability.** AWS replicates objects across at least three Availability Zones within a region automatically. You don't configure this - it's the default.
- **No in-place edits.** To update an object, you overwrite it with a new version. Objects are immutable once written.
- **5 TB max object size per object.** No limit on the number of objects in a bucket. For objects larger than 5 GB, use the multipart upload API.
- **100 buckets per account** (soft limit - you can request more). Objects are free to create as many as you need within a bucket.
- **Bucket names are globally unique across all AWS accounts.** If someone already has `my-app-assets`, you can't use it. Name buckets with enough specificity to avoid conflicts: `my-app-assets-prod-123456789`.

## What You Can Do With S3

**Store and serve any file.** Static assets, media, backups, exported data, trained ML model weights, database snapshots. If it's a file, S3 can store it.

**Host a static website.** Enable static website hosting on a bucket, point it at an `index.html`, and S3 serves your HTML, CSS, and JavaScript directly over HTTP. Pair it with CloudFront to get HTTPS and edge caching.

**Build a data lake.** Store CSV, JSON, or Parquet files in S3 and query them directly with Athena using standard SQL - no ETL pipeline, no servers, no loading data into a database first. This is the foundation of most AWS data lake architectures.

**Trigger downstream processing on file upload.** An object lands in a bucket, Lambda fires. Use prefix and suffix filters to scope which objects trigger which functions - only `.jpg` files in `uploads/`, only `.csv` files in `reports/`.

**Serve as a CloudFront origin.** S3 holds the assets, CloudFront caches and distributes them globally. The bucket stays private - Origin Access Control (OAC) gives CloudFront signed permission to read from it.

**Archive data automatically.** Lifecycle rules transition objects to cheaper storage classes (S3 Standard-IA, Glacier, Glacier Deep Archive) after a set number of days, or delete them entirely. Define the rule once and S3 handles the transitions.

**Emit events to other services.** S3 sends notifications when objects are created, deleted, or restored. Route those events to Lambda, SQS, SNS, or EventBridge and let downstream services react without polling.

## What S3 Is NOT For

**Block storage.** S3 objects are immutable replacements - you can't mount a bucket like a disk and write individual bytes to a file. For a volume you can attach to an EC2 instance and write to in-place, use EBS.

**Low-latency lookups.** S3 GET latency sits in the single-digit-to-tens-of-milliseconds range. That's fine for serving assets or reading data files, but it's not a substitute for DynamoDB or RDS in a hot request path where you need sub-millisecond reads.

**Frequent small file churn.** S3 pricing includes per-request charges. If your workload involves millions of small file reads and writes at high frequency, request costs will add up fast. S3 is optimized for large objects and batch-oriented access patterns, not high-frequency I/O on tiny files.

**Transactional data.** S3 has no query engine, no transactions, no foreign keys, no ACID guarantees across multiple objects. If your data needs to be queried with joins, updated transactionally, or kept consistent across operations, use a database.

**In-flight messaging.** S3 is storage, not a queue. It can notify other services when objects land, but it's not designed for reliable message delivery workflows. For that, use SQS or EventBridge.

## S3 Concepts Worth Knowing

| Concept | What It Is |
| --- | --- |
| **Bucket** | A globally unique namespace for storing objects. Buckets are regional - data stays in the region you create them in unless you enable cross-region replication. |
| **Object** | A file and its metadata stored in S3. An object is identified by its bucket name + key. |
| **Key** | The full identifier for an object within a bucket: `data/exports/report-2024.csv`. There are no real directories - the `/` is a naming convention. |
| **Prefix** | The "folder" portion of a key used to group related objects: `logs/2024/`. Prefix filtering is used in lifecycle rules, event notifications, and IAM policies. |
| **Storage Class** | S3 Standard for frequently accessed data. S3 Standard-IA (Infrequent Access) for data rarely read but still instantly retrievable. S3 Glacier Instant Retrieval, Glacier Flexible Retrieval, and Glacier Deep Archive for long-term archival at progressively lower cost and higher retrieval latency. |
| **Versioning** | When enabled, S3 retains all previous versions of every object. Deletions create a "delete marker" rather than removing the object. Useful for recovery from accidental overwrites and audit history. |
| **Lifecycle Rule** | An automated policy that transitions objects between storage classes or permanently deletes them after a set number of days. Define it once and S3 handles the rest. |
| **Bucket Policy** | A resource-based IAM policy attached to the bucket. Controls who can access it and under what conditions - other AWS accounts, CloudFront via OAC, anonymous public access, etc. |

## What It Works With

**Lambda.** S3 event notifications invoke Lambda directly when objects are created or deleted. An image upload fires a resize function. A CSV lands in a prefix and a processing pipeline kicks off. It's one of the most common patterns in AWS architectures.

**CloudFront.** Put CloudFront in front of an S3 bucket and you have a CDN-backed asset delivery layer with HTTPS, edge caching, and custom domains. Origin Access Control (OAC) is the current best practice - CloudFront gets signed access to the bucket, and the bucket itself stays private. Never expose the raw S3 bucket URL to end users.

**Athena.** Athena queries structured and semi-structured data in S3 using standard SQL - no servers, no loading data into a database. Define a table schema pointing at an S3 prefix, run a query, and results are written back to S3. This is the foundation of most serverless data lake patterns on AWS.

**EventBridge.** Enable S3 event notifications to EventBridge and objects created, deleted, or restored in a bucket emit events that EventBridge rules can match and route to any target - Lambda, Step Functions, SQS, SNS, another service entirely. It decouples the storage event from the consumer more cleanly than a direct Lambda notification.

## CDK Implementation

The CDK construct for S3 is `s3.Bucket`. It has sensible secure defaults out of the box: public access is blocked, server-side encryption is enabled. Most configuration is opt-in from there.

### Basic Bucket

```typescript
import * as s3 from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

const bucket = new s3.Bucket(this, "MyBucket", {
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
  removalPolicy: RemovalPolicy.DESTROY, // default is RETAIN
  autoDeleteObjects: true, // required for DESTROY when bucket has objects
});
```

`RemovalPolicy.RETAIN` is the default - the bucket survives a `cdk destroy`. Use it in production. `RemovalPolicy.DESTROY` is useful in dev and test stacks so you don't accumulate orphaned buckets. `autoDeleteObjects: true` deploys a Lambda-backed custom resource that empties the bucket before deletion; without it, a non-empty bucket with `DESTROY` will fail.

Server-side encryption with `S3_MANAGED` keys is always on by default now - you don't need to add it explicitly. It's included here for clarity.

### Static Website Hosting

```typescript
const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
  websiteIndexDocument: "index.html",
  websiteErrorDocument: "404.html",
  publicReadAccess: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

new cdk.CfnOutput(this, "WebsiteUrl", {
  value: websiteBucket.bucketWebsiteUrl,
});
```

For public static website hosting, `publicReadAccess: true` requires explicitly setting `blockPublicAccess` to `BLOCK_ACLS` - this blocks legacy ACLs while still allowing policy-based public access. S3 website hosting serves over HTTP only. For HTTPS, put CloudFront in front of it instead of using this pattern directly.

### Lambda Trigger on S3 Upload

```typescript
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";

const processingFn = new lambda.Function(this, "ProcessingFn", {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "handler.main",
  code: lambda.Code.fromAsset("lambda"),
});

bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(processingFn),
  { prefix: "uploads/", suffix: ".jpg" }, // optional key filters
);
```

CDK adds the necessary Lambda resource-based policy so S3 can invoke the function - you don't wire that up manually. Filter by `prefix` and `suffix` to avoid firing the function on every object in the bucket.

The Lambda handler receives an `S3Event` with one or more records:

```typescript
// lambda/handler.ts
import { S3Event } from "aws-lambda";

export const main = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    console.log(`Processing: s3://${bucket}/${key}`);
    // fetch and process the object...
  }
};
```

The `decodeURIComponent` + `replace` on the key is not optional - S3 URL-encodes object keys in the event payload, and spaces in keys become `+`.

### Granting IAM Permissions

`s3.Bucket` exposes `grant*` methods that scope permissions to the specific bucket ARN automatically:

```typescript
// Read-only access (s3:GetObject + s3:ListBucket)
bucket.grantRead(fn);

// Write access (s3:PutObject + multipart upload actions)
bucket.grantPut(fn);

// Read + write
bucket.grantReadWrite(fn);

// Scope to a specific prefix
bucket.grantRead(fn, "exports/*");
```

Pass a path pattern as the second argument to scope permissions to a prefix - `exports/*` rather than the whole bucket. For anything the grant methods don't cover:

```typescript
import * as iam from "aws-cdk-lib/aws-iam";

fn.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["s3:DeleteObject"],
    resources: [`${bucket.bucketArn}/tmp/*`],
  }),
);
```

Always scope to the minimum needed. Avoid `s3:*` and `arn:aws:s3:::*` in Lambda execution role policies.

### S3 + CloudFront Distribution

The standard pattern for serving S3 assets through CloudFront uses Origin Access Control (OAC). CloudFront gets a signed permission to read from the bucket - the bucket stays private, no public access needed:

```typescript
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

const assetBucket = new s3.Bucket(this, "AssetBucket", {
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  // no publicReadAccess - bucket stays private
});

const distribution = new cloudfront.Distribution(this, "Distribution", {
  defaultBehavior: {
    origin: origins.S3BucketOrigin.withOriginAccessControl(assetBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  defaultRootObject: "index.html",
});

new cdk.CfnOutput(this, "DistributionDomain", {
  value: distribution.distributionDomainName,
});
```

`S3BucketOrigin.withOriginAccessControl()` creates the OAC and updates the bucket policy to allow CloudFront to read from it - all automatic. The bucket never needs to be public. CloudFront handles HTTPS termination, edge caching, and custom domain support. S3 serves as the private origin.

## The Takeaway

- **S3 is object storage, not a filesystem or a database.** Objects are identified by key, stored as-is, and replaced rather than edited in-place. If your workload requires mutable, transactional, or queryable data, S3 is the wrong layer.
- **The defaults are secure.** Buckets block public access and encrypt at rest by default. Explicitly opening access - for static website hosting or CloudFront OAC grants - is a deliberate, opt-in decision.
- **CloudFront + S3 is the standard pattern for serving assets.** Don't expose your S3 bucket URL directly to end users. Use CloudFront with OAC, keep the bucket private, and get HTTPS and edge caching without doing anything extra.
- **Lambda triggers and EventBridge are the two ways S3 drives downstream processing.** Use Lambda notifications for direct, tightly coupled file processing on upload. Use EventBridge when you want to decouple the event from the consumer and route it to multiple targets.
- **Enable versioning in production.** The storage cost is small and recovering from an accidental overwrite or delete is straightforward with versioning enabled. Without it, there's no recovery path.
- **Set lifecycle rules on anything with a retention policy.** Objects don't archive or delete themselves. Automate it.
