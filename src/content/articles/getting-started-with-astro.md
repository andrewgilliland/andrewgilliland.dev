---
title: Getting Started with Astro
date: 2025-01-15
excerpt: Astro is a modern web framework that lets you build fast, content-focused websites using your favorite UI components.
draft: false
tags: ["astro", "typescript"]
---

## What is Astro?

Astro is a web framework designed for building content-driven websites. It ships zero JavaScript by default, sending only HTML and CSS to the browser unless you opt in to interactivity with _islands_.

## Why Astro?

- **Fast by default** - no JavaScript runtime overhead
- **UI agnostic** - use React, Svelte, Vue, or plain HTML
- **Content collections** - first-class support for Markdown and MDX with type-safe frontmatter
- **Static output** - deploy anywhere as plain HTML files

## Getting Started

Install a new project with:

```bash
npm create astro@latest
```

Then run the dev server:

```bash
npm run dev
```

## Content Collections

One of Astro's most powerful features is content collections. Define a schema for your content and get full TypeScript safety:

```ts
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
  }),
});
```

Then query it in any page:

```ts
const posts = await getCollection("blog");
```

Astro makes building fast, content-focused sites enjoyable from day one.
