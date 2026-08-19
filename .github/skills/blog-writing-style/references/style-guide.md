# andrewgilliland.dev Writing Style Guide

Write technical articles the way Andrew writes them: practical, direct, and problem-first. The site tagline is "Practical guides, real examples, no fluff" — every article should earn that.

## Voice

- Use short, declarative sentences.
- Prefer plain language over hedging and filler.
- Open with the real problem or tension, not a generic intro.
- Use contrast framing when helpful: state what a tool does not solve before saying what it does.
- Keep paragraphs short: 1-4 sentences.
- Avoid marketing language, hype, and superlatives.

## Structure

Use this shape when it fits the topic:

1. Title
2. Opening problem framing
3. Why this matters / why this approach
4. Conceptual background
5. Implementation with code
6. Infra or deployment notes if relevant
7. Trade-offs / why it scales
8. When not to use it
9. The Short Version

The problem-first opening, the reasoning section, and the short-version closer are the most consistent parts of the site style.

## Headings

- Use `##` for major sections.
- Use `###` sparingly for subdivisions.
- Headings should read like scannable chapter titles, not clickbait.
- Prefer phrases like "Why Put the Logic in an Authorizer Lambda" over question-heavy or generic headings.

## Code

- Use fenced code blocks with the correct language tag.
- Prefer TypeScript for AWS/CDK/API examples and Python for data/ML content.
- Show runnable-looking code, not pseudocode fragments.
- Include enough imports, types, and function signatures to be useful.
- After code, explain the behavior it creates in plain English.

## Lists

- Use bullets for scenarios, responsibilities, trade-offs, and recap points.
- Use numbered lists only for actual sequential steps.
- Keep list items short and direct.

## Frontmatter

Match the site’s article frontmatter style:

```yaml
---
title: "Article Title in Title Case"
description: "One to two sentences that capture the problem or tension the article resolves."
publishedTime: 2026-06-29T00:00:00.000Z
tags: ["aws", "serverless", "cognito"]
---
```

- Keep the description concise and concrete.
- Reuse existing tags where possible.
- Do not hardcode reading time.

## Avoid

- Generic conclusion headings; use "The Short Version".
- AI-sounding transitions and filler.
- Over-explaining syntax that a competent engineer already knows.
- Leaving out trade-offs or the "when not to use this" section.
