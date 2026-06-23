---
title: Building an Image Optimization Pipeline for S3 and CloudFront
date: 2026-06-22
excerpt: Build a practical image pipeline that generates responsive WebP and AVIF variants, fingerprints filenames, uploads to S3, and serves fast through CloudFront.
draft: false
tags: ["aws", "cloudfront", "s3", "astro", "performance"]
---

If you want fast image delivery without adding a third-party image service, this is a practical pipeline that works well:

1. Start from source images
2. Generate responsive variants (multiple widths)
3. Convert to modern formats (WebP and AVIF)
4. Fingerprint filenames for immutable caching
5. Upload to S3 with long-lived cache headers
6. Serve globally through CloudFront

This article shows an end-to-end implementation with code you can adapt.

## What This Pipeline Solves

- Avoids shipping oversized images to small screens
- Uses modern formats to cut transfer size
- Enables one-year cache headers safely via versioned filenames
- Produces deterministic image URLs your app can reference through a manifest

## Pipeline Architecture

High-level flow:

1. Put originals in `images/src`
2. Run optimization script
3. Script writes variants to `images/dist`
4. Script writes `images/dist/manifest.json`
5. Upload `images/dist` to S3 under `images/`
6. CloudFront serves from edge cache

## Folder Structure

```text
scripts/
  optimize-images.mjs
images/
  src/
    hero.jpg
    team.jpg
  dist/
    hero.1ab23cd4-480.webp
    hero.1ab23cd4-768.webp
    hero.1ab23cd4-1200.webp
    hero.1ab23cd4-1200.avif
    manifest.json
```

## Step 1: Install Build Dependencies

```bash
npm i -D sharp fast-glob
```

## Step 2: Image Optimization Script

Create `scripts/optimize-images.mjs`:

```js
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import fg from "fast-glob";
import sharp from "sharp";

const SRC_DIR = "images/src";
const OUT_DIR = "images/dist";
const WIDTHS = [480, 768, 1200, 1600];
const FORMATS = ["webp", "avif"];

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 8);
}

async function ensureCleanOutDir() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
}

async function optimizeOne(filePath) {
  const input = await fs.readFile(filePath);
  const image = sharp(input);
  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    throw new Error(`Could not read dimensions for ${filePath}`);
  }

  const baseName = path.basename(filePath, path.extname(filePath));
  const imageHash = hashBuffer(input);

  const outputs = [];

  for (const width of WIDTHS) {
    if (width > meta.width) continue;

    for (const format of FORMATS) {
      const outputName = `${baseName}.${imageHash}-${width}.${format}`;
      const outputPath = path.join(OUT_DIR, outputName);

      let pipeline = sharp(input).resize({
        width,
        withoutEnlargement: true,
      });

      if (format === "webp") {
        pipeline = pipeline.webp({ quality: 78 });
      } else {
        pipeline = pipeline.avif({ quality: 55 });
      }

      await pipeline.toFile(outputPath);

      outputs.push({
        format,
        width,
        file: outputName,
      });
    }
  }

  return {
    source: path.relative(SRC_DIR, filePath),
    key: baseName,
    width: meta.width,
    height: meta.height,
    outputs,
  };
}

async function main() {
  await ensureCleanOutDir();

  const files = await fg(["**/*.{jpg,jpeg,png,webp,avif}"], {
    cwd: SRC_DIR,
    absolute: true,
  });

  const manifest = {};

  for (const file of files) {
    const result = await optimizeOne(file);
    manifest[result.key] = result;
  }

  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log(`Processed ${files.length} image(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

What this does:

- Generates multiple widths
- Emits WebP and AVIF variants
- Uses a content hash in filenames
- Produces a manifest for application lookup

## Step 3: Upload Optimized Assets to S3

```bash
aws s3 sync images/dist s3://assets-biffco-prod/images \
  --delete \
  --cache-control "public,max-age=31536000,immutable"
```

If you keep old hashed files for a grace period, remove `--delete` and clean up with a lifecycle process later.

## Step 4: CloudFront Caching Behavior

For hashed image URLs, pair the upload cache header with CloudFront `CachingOptimized` policy. This gives:

- Browser cache reuse for up to one year
- Edge cache reuse across regions
- Fewer origin requests to S3

## Step 5: Consume the Manifest in Astro

Create a small helper at `src/lib/imageManifest.ts`:

```ts
import manifest from "../../images/dist/manifest.json";

type Variant = {
  format: string;
  width: number;
  file: string;
};

type ManifestEntry = {
  source: string;
  key: string;
  width: number;
  height: number;
  outputs: Variant[];
};

const ASSET_BASE = import.meta.env.PUBLIC_ASSET_BASE_URL;

export function getImageVariants(key: string, format: "webp" | "avif") {
  const entry = (manifest as Record<string, ManifestEntry>)[key];
  if (!entry) throw new Error(`Missing image key: ${key}`);

  return entry.outputs
    .filter((v) => v.format === format)
    .sort((a, b) => a.width - b.width)
    .map((v) => `${ASSET_BASE}/images/${v.file} ${v.width}w`)
    .join(", ");
}

export function getLargestFallback(key: string) {
  const entry = (manifest as Record<string, ManifestEntry>)[key];
  if (!entry) throw new Error(`Missing image key: ${key}`);

  const webp = entry.outputs
    .filter((v) => v.format === "webp")
    .sort((a, b) => b.width - a.width)[0];

  return {
    src: `${ASSET_BASE}/images/${webp.file}`,
    width: entry.width,
    height: entry.height,
  };
}
```

Then in Astro component markup:

```astro
---
import { getImageVariants, getLargestFallback } from "@/lib/imageManifest";

const key = "hero";
const avifSet = getImageVariants(key, "avif");
const webpSet = getImageVariants(key, "webp");
const fallback = getLargestFallback(key);
---

<picture>
  <source
    type="image/avif"
    srcset={avifSet}
    sizes="(max-width: 768px) 100vw, 1200px"
  />
  <source
    type="image/webp"
    srcset={webpSet}
    sizes="(max-width: 768px) 100vw, 1200px"
  />
  <img
    src={fallback.src}
    alt="Hero"
    width={fallback.width}
    height={fallback.height}
    loading="eager"
    decoding="async"
  />
</picture>
```

This gives responsive selection plus modern format negotiation in plain HTML.

## Step 6: Automate in CI

Example GitHub Actions job:

```yaml
name: Build and Publish Images

on:
  push:
    branches: [main]

jobs:
  images:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm clean-install
      - run: node scripts/optimize-images.mjs
      - name: Upload to S3
        run: |
          aws s3 sync images/dist s3://assets-biffco-prod/images \
            --cache-control "public,max-age=31536000,immutable"
```

Use OIDC role assumption for AWS credentials rather than long-lived access keys.

## Recommended Defaults

- Widths: 480, 768, 1200, 1600
- WebP quality: 75 to 82
- AVIF quality: 45 to 60
- Cache-Control for versioned files: `public,max-age=31536000,immutable`

Always validate with Lighthouse and real-device network throttling.

## When to Use an External Image Service

This pipeline is great for deterministic, build-time assets.

Move to Lambda@Edge or an external service when you need:

- Dynamic runtime resizing by query params
- User-uploaded image transformation on demand
- Watermarks or per-request overlays
- Advanced focal point/crop automation at request time

For many sites, build-time optimization plus CloudFront caching gets most of the performance gains with less complexity.
