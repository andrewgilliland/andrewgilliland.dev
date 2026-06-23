---
title: Real-Time Image Optimization with Lambda on S3 Upload
date: 2026-06-22
excerpt: Automatically optimize images the moment they're uploaded to S3 using Lambda functions triggered by S3 events. Perfect for user-generated content and dynamic workflows.
draft: false
tags: ["aws", "lambda", "s3", "performance", "cdk"]
---

If you want images optimized automatically as users or systems upload them, use a Lambda function triggered by S3 events. This approach works great for user-generated content, dynamic assets, or any workflow where you can't predict uploads in advance.

## What This Approach Solves

- No manual trigger needed — optimization happens immediately on upload
- Works for user-uploaded images without server-side involvement
- Supports dynamic workflows where source images aren't pre-planned
- Keeps original and optimized versions for fallback
- Scales automatically with Lambda

## Architecture

```
┌──────────────┐
│  User/App    │
└──────┬───────┘
       │
       │ uploads image
       ↓
┌──────────────────────────────────┐
│ S3 Bucket (source-images/)       │
│  └─ image.jpg                    │
└──────┬───────────────────────────┘
       │
       │ S3:ObjectCreated event
       ↓
┌──────────────────────────────────┐
│ Lambda Function                  │
│  └─ optimize-image               │
└──────┬───────────────────────────┘
       │
       │ downloads & processes
       ↓
┌──────────────────────────────────┐
│ S3 Bucket (optimized-images/)    │
│  ├─ image.abc123-480.webp        │
│  ├─ image.abc123-768.webp        │
│  ├─ image.abc123-1200.webp       │
│  └─ image.abc123.avif            │
└──────────────────────────────────┘
       │
       │ served via CloudFront
       ↓
    End User
```

## CDK Stack Setup

Create `lib/optimize-image-stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Duration } from "aws-cdk-lib";

export class OptimizeImageStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Source bucket: where users upload raw images
    const sourceBucket = new s3.Bucket(this, "SourceBucket", {
      bucketName: "images-source-uploads",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    // Output bucket: where optimized images live
    const optimizedBucket = new s3.Bucket(this, "OptimizedBucket", {
      bucketName: "images-optimized-cdn",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Lambda function to optimize images
    const optimizeFunction = new NodejsFunction(this, "OptimizeImage", {
      entry: "lambda/optimize-image.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(120),
      memorySize: 3008, // Sharp needs memory for image processing
      ephemeralStorageSize: cdk.Size.mebibytes(10240),
      environment: {
        OPTIMIZED_BUCKET: optimizedBucket.bucketName,
      },
    });

    // Grant Lambda permissions
    sourceBucket.grantRead(optimizeFunction);
    optimizedBucket.grantWrite(optimizeFunction);

    // Trigger Lambda on S3 upload
    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(optimizeFunction),
    );

    // Output the bucket names
    new cdk.CfnOutput(this, "SourceBucketName", {
      value: sourceBucket.bucketName,
    });

    new cdk.CfnOutput(this, "OptimizedBucketName", {
      value: optimizedBucket.bucketName,
    });
  }
}
```

Deploy with:

```bash
cdk deploy
```

## Lambda Function

Create `lambda/optimize-image.ts`:

```typescript
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { createHash } from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const OPTIMIZED_BUCKET = process.env.OPTIMIZED_BUCKET!;

const WIDTHS = [480, 768, 1200, 1600];
const QUALITY = { webp: 78, avif: 55 };

export async function handler(event: any) {
  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key);

    console.log(`Processing ${key} from ${bucket}`);

    // Download the uploaded image
    const { Body, ContentType } = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );

    if (!Body) throw new Error("No image body");

    const imageBuffer = await Body.transformToByteArray();
    const filename = key
      .split("/")
      .pop()!
      .replace(/\.[^.]+$/, "");

    // Verify it's an image
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(ContentType || "")) {
      console.log(`Skipping ${key}: unsupported type ${ContentType}`);
      return { statusCode: 400, body: "Unsupported image type" };
    }

    // Get original dimensions
    const metadata = await sharp(imageBuffer).metadata();
    console.log(
      `Original: ${metadata.width}x${metadata.height} (${ContentType})`,
    );

    const results: any[] = [];

    // Generate variants
    for (const width of WIDTHS) {
      // Skip if original is smaller than target width
      if ((metadata.width || 0) < width) {
        console.log(`Skipping ${width}px (original smaller)`);
        continue;
      }

      // WebP variant
      const webpBuffer = await sharp(imageBuffer)
        .resize(width, width, { fit: "cover", withoutEnlargement: true })
        .webp({ quality: QUALITY.webp })
        .toBuffer();

      const webpHash = createHash("sha256")
        .update(webpBuffer)
        .digest("hex")
        .slice(0, 8);
      const webpKey = `optimized/${filename}.${webpHash}-${width}.webp`;

      await s3.send(
        new PutObjectCommand({
          Bucket: OPTIMIZED_BUCKET,
          Key: webpKey,
          Body: webpBuffer,
          ContentType: "image/webp",
          CacheControl: "public,max-age=31536000,immutable",
        }),
      );

      results.push({
        format: "webp",
        width,
        size: webpBuffer.length,
        key: webpKey,
      });
      console.log(`✓ ${webpKey} (${webpBuffer.length} bytes)`);

      // AVIF variant
      const avifBuffer = await sharp(imageBuffer)
        .resize(width, width, { fit: "cover", withoutEnlargement: true })
        .avif({ quality: QUALITY.avif })
        .toBuffer();

      const avifHash = createHash("sha256")
        .update(avifBuffer)
        .digest("hex")
        .slice(0, 8);
      const avifKey = `optimized/${filename}.${avifHash}-${width}.avif`;

      await s3.send(
        new PutObjectCommand({
          Bucket: OPTIMIZED_BUCKET,
          Key: avifKey,
          Body: avifBuffer,
          ContentType: "image/avif",
          CacheControl: "public,max-age=31536000,immutable",
        }),
      );

      results.push({
        format: "avif",
        width,
        size: avifBuffer.length,
        key: avifKey,
      });
      console.log(`✓ ${avifKey} (${avifBuffer.length} bytes)`);
    }

    // Copy original as fallback
    const originalKey = `optimized/${filename}-original${key.substring(
      key.lastIndexOf("."),
    )}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: OPTIMIZED_BUCKET,
        Key: originalKey,
        Body: imageBuffer,
        ContentType: ContentType,
        CacheControl: "public,max-age=31536000,immutable",
      }),
    );
    console.log(`✓ ${originalKey} (original)`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        source: key,
        optimized: results,
        original: originalKey,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) }),
    };
  }
}
```

## Lambda Layer for Sharp

Sharp is a native module that needs to be bundled correctly. Create a layer:

```bash
mkdir -p layers/sharp-layer/nodejs
cd layers/sharp-layer/nodejs
npm init -y
npm install sharp
cd ../..
zip -r sharp-layer.zip sharp-layer
aws lambda publish-layer-version \
  --layer-name sharp \
  --zip-file fileb://sharp-layer.zip \
  --compatible-runtimes nodejs22.x
```

Then reference in CDK:

```typescript
const sharpLayer = lambda.LayerVersion.fromLayerVersionArn(
  this,
  "SharpLayer",
  `arn:aws:lambda:${this.region}:${this.account}:layer:sharp:1`,
);

const optimizeFunction = new NodejsFunction(this, "OptimizeImage", {
  // ... other config
  layers: [sharpLayer],
});
```

Or use a simpler approach with `@aws-lambda-powertools/commons`:

```typescript
const optimizeFunction = new NodejsFunction(this, "OptimizeImage", {
  entry: "lambda/optimize-image.ts",
  bundling: {
    externalModules: ["sharp"], // Don't bundle, use layer
  },
  layers: [
    lambda.LayerVersion.fromLayerVersionArn(
      this,
      "SharpLayer",
      `arn:aws:lambda:${this.region}:${this.account}:layer:sharp:1`,
    ),
  ],
});
```

## Using Optimized Images in React

Create a hook to query the optimized bucket:

```tsx
import React from "react";

interface ImageVariant {
  format: "webp" | "avif";
  width: number;
  key: string;
}

interface OptimizedImageProps {
  imageKey: string;
  alt: string;
  className?: string;
}

export function OptimizedImage({
  imageKey,
  alt,
  className,
}: OptimizedImageProps) {
  const assetBase = "https://images-optimized.example.com";
  const [variants, setVariants] = React.useState<ImageVariant[]>([]);

  React.useEffect(() => {
    // Query S3 API Gateway or Lambda to list variants for this image
    fetch(`/api/images/${imageKey}`)
      .then((r) => r.json())
      .then((data) => setVariants(data.variants));
  }, [imageKey]);

  const webpVariants = variants.filter((v) => v.format === "webp");
  const avifVariants = variants.filter((v) => v.format === "avif");
  const fallback = webpVariants[webpVariants.length - 1];

  if (!fallback) return null;

  return (
    <picture>
      {avifVariants.length > 0 && (
        <source
          type="image/avif"
          srcSet={avifVariants
            .map((v) => `${assetBase}/${v.key} ${v.width}w`)
            .join(", ")}
        />
      )}
      {webpVariants.length > 0 && (
        <source
          type="image/webp"
          srcSet={webpVariants
            .map((v) => `${assetBase}/${v.key} ${v.width}w`)
            .join(", ")}
        />
      )}
      <img
        src={`${assetBase}/${fallback.key}`}
        alt={alt}
        className={className}
        loading="lazy"
      />
    </picture>
  );
}
```

## CI/CD: Upload Images to S3

In your workflow, upload images directly to the source bucket:

```yaml
- name: Upload images to S3
  run: |
    aws s3 sync ./source-images s3://images-source-uploads/ \
      --delete
```

Lambda handles the rest automatically.

## Costs

Lambda on S3 upload costs roughly:

- **Duration:** ~10-15s per image (depends on size)
- **Memory:** 3 GB allocated
- **Per image:** $0.0000333 per second × 12 seconds = ~$0.0004 per image
- **Requests:** $0.20 per million invocations

For 10,000 images/month: ~$4-5/month in Lambda costs + S3 storage.

## When to Use This Approach

| Scenario         | Batch           | Lambda on Upload |
| ---------------- | --------------- | ---------------- |
| Editorial images | ✅ Simpler      | Overkill         |
| User uploads     | ❌ Manual       | ✅ Perfect       |
| Dynamic content  | ❌ Manual       | ✅ Perfect       |
| High volume      | ⚠️ Rate limited | ✅ Scales        |
| Cost sensitive   | ✅ Pay per run  | ⚠️ Pay per image |

Use Lambda on S3 upload when images arrive unpredictably or users control the uploads.

## Monitoring

Add CloudWatch insights to Lambda:

```typescript
const optimizeFunction = new NodejsFunction(this, "OptimizeImage", {
  // ... other config
  logRetention: logs.RetentionDays.ONE_WEEK,
});

// CloudWatch alarm for errors
new cloudwatch.Alarm(this, "OptimizeErrorAlarm", {
  metric: optimizeFunction.metricErrors(),
  threshold: 5,
  evaluationPeriods: 1,
  alarmDescription: "Alert on image optimization failures",
});
```

This keeps your image pipeline automated and ready for dynamic content.
