# andrewgilliland.dev Writing Style Guide

This site’s content style is practical, direct, and problem-first. The site tagline is "Practical guides, real examples, no fluff" — every article should earn that.

## Voice

- Use short, declarative sentences.
- Prefer plain language over hedging and filler.
- Open with the real problem or tension, not a generic intro.
- Use contrast framing when helpful: state what a tool does not solve before saying what it does.
- Keep paragraphs short: 1-4 sentences.
- Avoid marketing language, hype, and superlatives.

## Structure

Use this structure when it fits the topic:

1. Title
2. Opening problem framing
3. Context or why the topic matters
4. Conceptual background
5. Implementation with code
6. Infra or deployment notes if relevant
7. Trade-offs / when the approach fits
8. When Not to Use This, when relevant
9. The Takeaway

The problem-first opening, topic-specific sections, and a plain takeaway close are the most consistent parts of the site style. This is a guide, not a rigid outline.

## Headings

- Use `##` for major sections.
- Use `###` sparingly for subdivisions.
- Headings should read like scannable chapter titles, not clickbait.
- Prefer headings that describe the actual content, such as `## The Problem`, `## What We're Building`, `## What Is Amazon S3?`, or `## Setting Up with uv`.
- Use `## The Takeaway` for the standard closing section.
- Avoid a generic `## Conclusion` heading.

## Code

- Use fenced code blocks with the correct language tag.
- Prefer TypeScript for AWS/CDK/API examples and Python for data/ML examples.
- Show runnable-looking code, not fragments or pseudocode.
- Include enough imports, types, and function signatures to be useful.
- After code, explain the behavior it creates in plain English.

## Lists

- Use bullets for scenarios, responsibilities, trade-offs, and recap points.
- Use numbered lists only for actual sequential steps.
- Keep list items short and direct.

## Frontmatter

The site’s actual article schema is:

```yaml
---
title: "Article Title"
date: 2026-08-18
excerpt: "One or two sentences describing the problem or tension this article solves."
draft: false
tags: ["aws", "typescript"]
---
```

This is the required structure for articles. The site auto-checks the frontmatter schema, and the content is expected to match it.

- `title` should be direct and specific.
- `date` should be a real UTC date in `YYYY-MM-DD` format.
- `excerpt` should read like the article’s opening tension, not a generic summary.
- `tags` should reuse existing site tags when possible.
- Do not invent fields or omit required ones.

## Avoid

- Generic conclusion headings; use `The Takeaway` for the standard close.
- AI-sounding transitions and filler.
- Over-explaining syntax a competent engineer already knows.
- Omitting trade-offs or the "When Not to Use This" section where it matters.
