---
title: Build an Asset CDN on AWS with CDK (S3 + CloudFront + Route53 + ACM)
date: 2026-06-22
excerpt: Build a fast asset pipeline with a private S3 origin, CloudFront caching, custom DNS, and HTTPS certificates using AWS CDK.
draft: false
tags: ["aws", "cdk", "cloudfront", "s3", "route53", "acm"]
---

If your app already runs well but static assets still feel slow, this setup usually fixes it.

You keep assets in S3, put CloudFront in front, map a custom domain like `assets.biffco.com`, and terminate HTTPS with ACM. Then your app loads images, fonts, and other static files from a globally cached edge network.

This article walks through a practical CDK setup and how an Astro site consumes that asset domain.

## What We Are Building

We are building an asset delivery layer, not full site hosting:

- Private S3 bucket to store asset files
- CloudFront distribution in front of that bucket
- Route53 alias record for `assets.biffco.com`
- ACM certificate for TLS on that subdomain
- Cache policy tuned for static assets

Request flow:

1. Browser requests `https://assets.biffco.com/images/hero-abc123.webp`
2. Route53 resolves `assets.biffco.com` to CloudFront
3. CloudFront returns from edge cache when possible
4. On cache miss, CloudFront fetches from private S3 using OAC
5. Browser caches based on `Cache-Control`

## Why Private S3 + OAC

You could make the S3 bucket public, but private origin access is better.

| Option                          | Security | Typical Use     |
| ------------------------------- | -------- | --------------- |
| Public S3 bucket                | Weaker   | Quick prototype |
| Private bucket + CloudFront OAC | Stronger | Production      |

With Origin Access Control (OAC), only CloudFront can read from the bucket. Direct public S3 access is blocked.

## CDK Stack

This example assumes:

- Hosted zone `biffco.com` already exists in Route53
- You want to serve assets on `assets.biffco.com`
- CDK v2 with TypeScript

```ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export class AssetCdnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const rootDomain = "biffco.com";
    const assetDomain = `assets.${rootDomain}`;

    const zone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: rootDomain,
    });

    // CloudFront certificates must be in us-east-1.
    const certificate = new acm.Certificate(this, "AssetCert", {
      domainName: assetDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const bucket = new s3.Bucket(this, "AssetBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const distribution = new cloudfront.Distribution(this, "AssetDist", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      domainNames: [assetDomain],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    new route53.ARecord(this, "AssetAlias", {
      zone,
      recordName: "assets",
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
    });

    // Optional: deploy local asset files and invalidate changed paths.
    new s3deploy.BucketDeployment(this, "DeployAssets", {
      destinationBucket: bucket,
      sources: [s3deploy.Source.asset("./public/assets")],
      prune: false,
      cacheControl: [
        s3deploy.CacheControl.public(),
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)),
        s3deploy.CacheControl.fromString("immutable"),
      ],
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "AssetDomain", {
      value: `https://${assetDomain}`,
    });
  }
}
```

## ACM Region Gotcha

CloudFront only accepts ACM certificates in `us-east-1`.

If your application stacks deploy in another region, create/import this certificate from `us-east-1` and reference it in your distribution config.

## Caching Strategy That Actually Helps Performance

Use long browser cache lifetimes for immutable files and version filenames.

Recommended for hashed files:

```text
Cache-Control: public, max-age=31536000, immutable
```

For files you overwrite in place, use shorter TTLs and invalidate when needed.

| Asset type           | Header                                | Notes            |
| -------------------- | ------------------------------------- | ---------------- |
| Hashed JS/CSS/images | `public, max-age=31536000, immutable` | Best performance |
| Mutable images       | `public, max-age=86400`               | Safer updates    |

The ideal production pattern is still hashed filenames, not frequent invalidations.

## Astro Integration

Use an environment-driven asset base URL so local and production environments are easy to switch.

In `.env`:

```bash
PUBLIC_ASSET_BASE_URL=https://assets.biffco.com
```

In Astro/TS:

```ts
const assetBase = import.meta.env.PUBLIC_ASSET_BASE_URL;
const heroUrl = `${assetBase}/images/hero-abc123.webp`;
```

In a component:

```astro
---
const assetBase = import.meta.env.PUBLIC_ASSET_BASE_URL;
const heroUrl = `${assetBase}/images/hero-abc123.webp`;
---

<img
  src={heroUrl}
  alt="Hero image"
  width="1200"
  height="630"
  loading="eager"
  decoding="async"
/>
```

For below-the-fold images, switch to `loading="lazy"`.

## Basic Image Optimization Layer

For most sites, you do not need an external image service right away.

Start with build-time optimization:

- Export modern formats (WebP, AVIF where useful)
- Generate multiple responsive widths
- Keep dimensions in markup to avoid layout shift
- Serve through CloudFront with long-lived cache headers

Move to Lambda@Edge or external services only if you need runtime transformations (dynamic crops, arbitrary resize parameters, watermarking, etc.).

## How This Improves Lighthouse

This setup helps common Lighthouse findings:

- Efficient cache lifetimes (long `max-age` for static assets)
- Faster image delivery due to edge caching
- Better repeat-visit performance due to browser cache reuse

CloudFront cache plus correct `Cache-Control` headers is the core of the win.

## Final Checklist

- [ ] S3 bucket is private
- [ ] CloudFront uses OAC to access S3
- [ ] ACM cert for `assets.biffco.com` is valid in `us-east-1`
- [ ] Route53 alias points `assets.biffco.com` to distribution
- [ ] Assets use versioned filenames
- [ ] Cache headers are set correctly on uploaded files

If you implement those six correctly, you will get fast and reliable static asset delivery without adding unnecessary infrastructure.

If you want to go deeper after this, see [Intro to S3](/articles/intro-to-s3) and [Intro to AWS CDK](/articles/intro-to-aws-cdk).
