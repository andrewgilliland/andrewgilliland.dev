---
title: Autonomous Test Generation with Playwright and Claude
date: 2026-05-28
excerpt: How to build an AI agent that crawls your site, observes each page, and writes Playwright spec files — without you authoring a single selector.
draft: false
tags: ["testing", "playwright", "ai", "anthropic"]
---

The [previous article in this series](./ai-powered-e2e-testing-with-playwright-and-claude) covered making existing tests smarter - using Claude to reason about page state instead of matching brittle selectors. This one goes one step earlier: eliminating the authoring step entirely.

Writing E2E tests is repetitive work. You navigate to a page, observe what's there, decide what's worth testing, translate that into selectors, and write assertions. For every new page you add, you do it again. The actual judgment calls - "is the heading visible?", "does this nav link work?", "does the search filter results?" - don't require much creativity. They're pattern-matching against a page you can just look at.

That's the job we're handing off. The agent navigates your site, observes each page through Playwright, decides what's worth testing, and writes the spec files. You review and commit.

## The Core Idea

An AI agent is a loop: send a message to the model, execute whichever tool it chooses, feed the result back, repeat until it decides it's done.

The tools we expose:

- `navigate` — go to a URL and wait for it to load
- `get_snapshot` — return visible text and interactive elements from the current page
- `get_links` — return internal navigation links
- `write_spec_file` — write a generated `.spec.ts` file to disk

Claude decides the sequence: explore this page, follow that link, observe the next page, write a spec, move on. When it has covered the site and written files for each section, it stops.

## Setup

You'll need Playwright and the Anthropic SDK:

```bash
npm install @anthropic-ai/sdk
npx playwright install chromium
```

Create `scripts/generate-tests.ts`. This is a standalone script you run once (or whenever you add new pages), not part of your test suite itself.

## The Tool Definitions

Claude needs a typed schema for each tool before it can call them:

```ts
import Anthropic from "@anthropic-ai/sdk";

const tools: Anthropic.Tool[] = [
  {
    name: "navigate",
    description: "Navigate to a URL and wait for the page to load.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "Absolute URL to navigate to" },
      },
      required: ["url"],
    },
  },
  {
    name: "get_snapshot",
    description:
      "Get the visible text content and interactive elements of the current page. Use this after navigating to understand what the page contains.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_links",
    description:
      "Get all internal navigation links on the current page as an array of { text, href } objects.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "write_spec_file",
    description:
      "Write a Playwright spec file. Call this after observing a page and deciding what tests to write for it.",
    input_schema: {
      type: "object" as const,
      properties: {
        filename: {
          type: "string",
          description: "Filename for the spec, e.g. homepage.spec.ts",
        },
        content: {
          type: "string",
          description: "Full TypeScript content of the spec file",
        },
      },
      required: ["filename", "content"],
    },
  },
];
```

The descriptions matter. Claude uses them to decide when to call each tool and what arguments to pass. "Use this after navigating to understand what the page contains" tells the model the intended sequencing without hardcoding it.

## Tool Execution

Each tool maps to a Playwright action or a file write:

```ts
import { chromium, type Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

async function getPageSnapshot(page: Page): Promise<string> {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const style = window.getComputedStyle(parent);
          if (style.display === "none" || style.visibility === "hidden")
            return NodeFilter.FILTER_REJECT;
          return node.textContent?.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      },
    );

    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      texts.push(node.textContent!.trim());
    }

    const buttons = Array.from(document.querySelectorAll("button")).map(
      (b) => `[button: ${b.textContent?.trim()}]`,
    );
    const inputs = Array.from(document.querySelectorAll("input")).map(
      (i) => `[input: ${i.placeholder || i.name || i.type}]`,
    );
    const links = Array.from(document.querySelectorAll("a[href]")).map(
      (a) =>
        `[link: ${a.textContent?.trim()} -> ${(a as HTMLAnchorElement).href}]`,
    );

    return [...texts, ...buttons, ...inputs, ...links].join(" | ");
  });
}

async function getLinks(page: Page, baseUrl: string): Promise<string> {
  const links = await page.evaluate((base) => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({
        text: a.textContent?.trim() ?? "",
        href: (a as HTMLAnchorElement).href,
      }))
      .filter(({ href }) => href.startsWith(base));
  }, baseUrl);
  return JSON.stringify(links, null, 2);
}

function buildToolExecutor(page: Page, baseUrl: string, outputDir: string) {
  return async function executeTool(
    name: string,
    input: Record<string, string>,
  ): Promise<string> {
    switch (name) {
      case "navigate":
        await page.goto(input.url, { waitUntil: "networkidle" });
        return `Navigated to ${input.url}. Current URL: ${page.url()}`;

      case "get_snapshot":
        return getPageSnapshot(page);

      case "get_links":
        return getLinks(page, baseUrl);

      case "write_spec_file": {
        const filePath = path.join(outputDir, input.filename);
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(filePath, input.content, "utf-8");
        return `Wrote ${filePath}`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  };
}
```

The snapshot function is reused from the previous article - it strips the page down to visible text, button labels, input placeholders, and links. `getLinks` filters to internal links only so the agent doesn't follow external URLs.

## The Agent Loop

This is the core of the script. It runs until Claude's `stop_reason` is `"end_turn"`:

```ts
async function runAgent(baseUrl: string, outputDir: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const executeTool = buildToolExecutor(page, baseUrl, outputDir);
  const client = new Anthropic();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `You are a QA engineer generating Playwright tests for a website.

Base URL: ${baseUrl}

Instructions:
1. Navigate to the base URL and discover all main sections via internal links
2. For each section, take a snapshot to understand what the page contains
3. Write one spec file per section (homepage.spec.ts, articles.spec.ts, etc.)
4. Each spec should test: does the main content render? do interactive elements exist? does navigation work?
5. Use semantic selectors: getByRole, getByText, getByPlaceholder — never CSS class selectors
6. Write tests that verify outcomes a user would care about, not implementation details
7. When you have covered all main sections and written all spec files, stop.

Start by navigating to the base URL, then use get_links to discover the site structure.`,
    },
  ];

  let iterations = 0;
  const maxIterations = 20; // safety cap

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === "tool_use") {
        console.log(
          `→ ${block.name}`,
          JSON.stringify(block.input).slice(0, 80),
        );
        const result = await executeTool(
          block.name,
          block.input as Record<string, string>,
        );
        console.log(`  ✓ ${result.slice(0, 120)}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    if (toolResults.length === 0) break;

    messages.push({ role: "user", content: toolResults });
  }

  await browser.close();
}

const baseUrl = process.argv[2] ?? "http://localhost:4173";
const outputDir = process.argv[3] ?? "e2e/generated";

runAgent(baseUrl, outputDir).catch(console.error);
```

The `maxIterations` cap prevents runaway loops if the model gets stuck cycling between pages. Twenty iterations is enough for a site with five to ten pages; raise it for larger sites.

The `console.log` lines give you visibility into what the agent is doing while it runs - which URL it navigated to, what files it wrote. Without them a 30-second run is a black box.

## Running It

Add a script to `package.json`:

```json
"generate:tests": "npx tsx scripts/generate-tests.ts"
```

Start your dev server in one terminal, then in another:

```bash
npm run generate:tests http://localhost:4173 e2e/generated
```

The agent navigates the site, prints each action, and writes spec files to `e2e/generated/`. A run against a five-page site typically takes 20–40 seconds.

## What It Generates

Running the agent against this site produces something like:

```ts
// e2e/generated/homepage.spec.ts
import { test, expect } from "@playwright/test";

test("homepage renders hero heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("homepage navigation links are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /articles/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /projects/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /about/i })).toBeVisible();
});

test("homepage navigates to articles", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /articles/i })
    .first()
    .click();
  await expect(page).toHaveURL(/articles/);
});
```

```ts
// e2e/generated/articles.spec.ts
import { test, expect } from "@playwright/test";

test("articles page renders article list", async ({ page }) => {
  await page.goto("/articles");
  await expect(page.locator("article").first()).toBeVisible();
});

test("articles search filters results", async ({ page }) => {
  await page.goto("/articles");
  await page.getByPlaceholder("Search articles…").fill("lambda");
  await expect(page.getByText(/lambda/i).first()).toBeVisible();
});

test("article detail page renders heading", async ({ page }) => {
  await page.goto("/articles");
  await page.locator("article").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

These are reasonable smoke tests. They're not exhaustive, but they cover the basics for every page and use `getByRole` and `getByPlaceholder` rather than class selectors. Compare this to the hand-written `e2e/articles.spec.ts` in the repo - the generated version gets most of the same coverage with zero manual authoring.

## What It Gets Wrong

**Redundant assertions.** The agent sometimes writes three tests that all check the same thing slightly differently. Easy to remove on review.

**Overly specific text.** It occasionally hardcodes exact strings like `getByText("Andrew Gilliland")` that will fail if content changes. Replace those with role-based selectors before committing.

**Missing edge cases.** The agent can only test what it observes on a normal visit. It won't know that searching for a nonsense query should show an empty state message unless it actually tries that query during exploration. Edge cases and business rules still need manual tests.

**Navigation depth.** The agent discovers links from the pages it visits. Content only reachable after interaction - modals, tabs, paginated results - won't be explored. Seed those URLs explicitly in the prompt, or add a `click` tool to the schema to give the agent more reach.

## Workflow

The agent output is a first draft, not a final commit:

1. Run the agent against your dev server
2. Review the generated specs - remove duplicates, replace hardcoded text with role selectors
3. Move reviewed files from `e2e/generated/` to `e2e/`
4. Run the suite: `npx playwright test`
5. Fix any tests that fail due to agent assumptions that don't hold

After the initial run, you don't re-run the agent for every change - just when you add a new page or section that needs coverage.

## Tradeoffs

**It's a starting point, not a complete suite.** Generated tests cover obvious happy paths. Complex flows, edge cases, and business rules still need manual authoring.

**Review is mandatory.** Committing generated code without reading it is how you end up with tests that pass unconditionally or assert the wrong things. Treat generated specs the same way you'd treat any generated boilerplate.

**Cost.** A full site exploration with several `get_snapshot` calls uses a few thousand tokens per page. For a ten-page site, expect 50–100k tokens total - a few cents. Keep the `maxIterations` cap and don't run this in CI on every commit.

## When to Use This

Use this when starting coverage from scratch - bootstrapping a spec file per page in minutes rather than hours. It's also useful when you add a significant new section and want baseline coverage immediately without interrupting the feature work to write tests.

Pair it with the [AI-Powered E2E Testing](./ai-powered-e2e-testing-with-playwright-and-claude) pattern for the best of both: generated tests to cover the surface area, semantic assertions to make the critical ones resilient to UI churn.
