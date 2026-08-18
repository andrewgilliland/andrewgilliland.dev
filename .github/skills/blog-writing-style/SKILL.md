---
name: blog-writing-style
description: Write and format articles for andrewgilliland.dev in Andrew's established voice and structure. Use when drafting a new blog post, portfolio article, or technical write-up for the site, or when editing/reformatting existing draft content to match site conventions.
---

# andrewgilliland.dev Writing Style

Write technical articles the way Andrew writes them: practical, direct, no fluff, problem-first. The tagline for the site is "Practical guides, real examples, no fluff" — every article should earn that.

## Voice

- Short, declarative sentences. Avoid hedging ("might", "could potentially") — state things plainly.
- First person is fine for framing opinions ("I like this pattern for three reasons"), but the bulk of the writing is second person / neutral instructional ("you attach it to the protected routes").
- No filler intros. Open with the actual problem or tension, not "In this article, we will explore..."
- Prefer contrast framing to open a piece or section: state what a tool/approach does NOT solve before saying what does. Example pattern: "Cognito can tell you who a user is. It cannot answer what they are allowed to do."
- Keep paragraphs short — 1 to 4 sentences. Break up any paragraph that runs longer.
- Avoid marketing language, superlatives, and hype words ("revolutionary", "game-changing", "seamless").

## Structure

Standard article shape, in order:

1. **Title** — states the technology/pattern plainly (e.g. "Authorizer Lambdas with Cognito and API Gateway"), no clickbait, no "The Ultimate Guide to..."
2. **Opening (1-3 short paragraphs, no heading)** — establish the real question or problem before any solution talk. Frame why the obvious answer isn't the full answer.
3. **A "why does this matter / why this approach" section** — often phrased as "Why X" or as a short list of reasons ("I like this pattern for three reasons... First,... Second,... Third,...").
4. **Conceptual/background section(s)** — explain the pieces involved before showing code. Use bullet lists for enumerating scenarios or capabilities (e.g. "Can this user delete an article? Can they access tenant A but not tenant B?").
5. **Implementation section(s) with code** — real, runnable-looking code, not pseudocode. Show the actual pattern (e.g. a full Lambda handler), not a fragment missing context.
6. **Infra/deployment section if relevant** — CDK or equivalent, showing how the piece gets wired up in the broader system.
7. **"Why this scales" or trade-offs section** — be honest about what the pattern buys you operationally.
8. **"When not to use this" section** — always include this for any pattern/approach article. A bullet list of conditions under which the simpler alternative is correct. This is a signature move — don't skip it.
9. **"The Short Version" closing section** — a compressed summary in 2-4 sentences, often followed by a short bullet recap of the responsibility boundaries or key takeaways.

Not every article needs all sections (a shorter "Intro to X" piece may skip the "when not to use this" section), but the problem-first opening, the reasoning section, and the short-version closer are consistent across the site.

## Headings

- Use `##` for major sections, `###` only for a rare subdivision within a large implementation section.
- Heading text is a phrase, not a question dressed as clickbait — e.g. "Why Put the Logic in an Authorizer Lambda", "What the Authorizer Lambda Does", "The Short Version".
- Headings should be scannable as a table of contents on their own (the site auto-generates a ToC from them).

## Code blocks

- Fenced code blocks with the language tag (`typescript`, `python`, etc.). Diagrams-as-text (like a request flow arrow chain) use a plain fenced block with no language tag.
- Code should be complete enough to actually run or closely resemble production code — include imports, types, and function signatures. Stub out non-essential logic with a clear placeholder (e.g. a `hasPermission` function that returns `true` with a comment implying "make this smarter over time") rather than omitting it with `// ...`.
- Prefer TypeScript for AWS/CDK/API examples and Python for data/ML examples, matching Andrew's stack.
- After a code block, add a short paragraph or bullet list translating the code into the responsibility/behavior it provides — don't just drop code and move on.

## Lists

- Use bullet lists for: enumerating scenarios/questions, enumerating responsibilities, "when not to use this" conditions, and short recap points.
- Use numbered lists only for actual sequential steps (e.g. "the authorizer does four things: 1. Verifies... 2. Reads... 3. Looks up... 4. Returns...").
- Keep list items short — a phrase or single sentence, not a paragraph per bullet.

## Frontmatter (Astro content collection)

Match the site's existing frontmatter fields for article files:

```yaml
---
title: "Article Title in Title Case"
description: "One to two sentences. Should work standalone as the meta description and social preview text — state the core tension/problem the article resolves, not a generic summary."
publishedTime: 2026-06-29T00:00:00.000Z
tags: ["aws", "serverless", "cognito"]
---
```

- `description` doubles as the OG/Twitter description — write it as a compressed version of the article's opening tension, not "This article covers...".
- `tags` should reuse existing site tags where they fit (`aws`, `python`, `cdk`, `serverless`, `typescript`, `ai`, `databases`, `ci-cd`, `testing`, `github-actions`, `react`, `tanstack`, etc.) rather than inventing near-duplicates.
- Reading time is auto-calculated by the site; don't hardcode it.

## Things to avoid

- Don't add a "Conclusion" heading — use "The Short Version" instead, matching site convention.
- Don't write generic AI-sounding transitions ("Now that we've covered X, let's move on to Y", "It's worth noting that...").
- Don't over-explain basic syntax; assume a competent engineer reader who needs the pattern and reasoning, not a tutorial for the language itself.
- Don't bury the "when not to use this" section — omitting trade-offs reads as marketing, not engineering writing.
