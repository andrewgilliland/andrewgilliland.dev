---
title: AI-Powered E2E Testing with Playwright and Claude
date: 2026-05-27
excerpt: How to use Claude's API alongside Playwright to write semantic smoke tests that reason about page state instead of matching brittle selectors.
draft: false
tags: ["testing", "playwright", "ai", "anthropic"]
---

Most E2E tests break for the wrong reasons. You rename a CSS class, swap a `div` for a `section`, or update button copy from "Add to Cart" to "Buy Now" - none of these changes break the user experience, but your tests go red. You end up updating selector strings instead of catching real regressions.

The pattern this article covers takes a different approach: instead of asserting against selectors, you send a plain-text snapshot of the page to Claude and ask it a semantic question. Did this checkout succeed? Is there an error on the page? Does this look like a confirmation screen? The model reasons about the page the way a human QA engineer would and returns a structured verdict your assertions can check.

## The Core Idea

Traditional assertion:

```ts
await expect(page.locator(".order-confirmation-banner")).toBeVisible();
```

AI-reasoned assertion:

```ts
const snapshot = await getPageSnapshot(page);
const analysis = await analyzePageState(
  snapshot,
  "Did the checkout succeed? Look for an order number, thank-you message, or receipt summary.",
);
expect(analysis.verdict).toBe("pass");
```

The second version doesn't know or care what class the confirmation banner has. It reads the page like a person and makes a judgment call. Rename the class, restructure the layout, rewrite the copy - the test still passes as long as the user's goal was actually accomplished.

## Setup

Install the Anthropic SDK alongside your existing Playwright setup:

```bash
npm install @anthropic-ai/sdk
```

You'll need an API key from [console.anthropic.com](https://console.anthropic.com). Store it as an environment variable:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

In CI, add it to your secrets and expose it to the test runner. In GitHub Actions:

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## The Helpers

These two functions do the heavy lifting. Put them in a shared `e2e/ai-helpers.ts` file.

### `getPageSnapshot`

```ts
import type { Page } from "@playwright/test";

export async function getPageSnapshot(page: Page): Promise<string> {
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

    return [...texts, ...buttons, ...inputs].join(" | ");
  });
}
```

This strips the page down to what matters: visible text, button labels, and input placeholders - no HTML, no class names. The `TreeWalker` skips `display: none` and `visibility: hidden` elements, so the model sees what the user sees.

### `analyzePageState`

````ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function analyzePageState(
  pageContent: string,
  question: string,
): Promise<{ verdict: "pass" | "fail" | "uncertain"; reasoning: string }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a QA engineer analyzing a webpage snapshot.

Here is the current page content (visible text and interactive elements):
<page_content>
${pageContent}
</page_content>

Question: ${question}

Respond ONLY with a JSON object in this exact shape:
{
  "verdict": "pass" | "fail" | "uncertain",
  "reasoning": "one or two sentences explaining your verdict"
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { verdict: "uncertain", reasoning: "Could not parse AI response." };
  }
}
````

The `uncertain` case is intentional - sometimes the model isn't confident. Design your assertions around it: use `not.toBe("fail")` where uncertainty is acceptable, and reserve `toBe("pass")` for critical success states.

## Writing a Smoke Test

Here's a checkout flow test using both helpers:

```ts
import { test, expect } from "@playwright/test";
import Anthropic from "@anthropic-ai/sdk";
import { analyzePageState, getPageSnapshot } from "./ai-helpers";

const client = new Anthropic();

test("completes checkout and confirms success", async ({ page }) => {
  await page.goto("/products/sample-item");

  let snapshot = await getPageSnapshot(page);
  let analysis = await analyzePageState(
    snapshot,
    "Is this a product page with a purchasable item and an add-to-cart or buy option?",
  );
  console.log(`[Product page] ${analysis.verdict}: ${analysis.reasoning}`);
  expect(analysis.verdict).toBe("pass");

  // Ask Claude what the add-to-cart button probably says,
  // then click by text instead of selector - survives copy changes
  const buttonResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: `What text does the add-to-cart button most likely contain on this page?
Respond with ONLY the button text.

Page: ${snapshot}`,
      },
    ],
  });

  const buttonText =
    buttonResponse.content[0].type === "text"
      ? buttonResponse.content[0].text.trim()
      : "Add to Cart";

  await page.getByText(buttonText, { exact: false }).first().click();

  snapshot = await getPageSnapshot(page);
  analysis = await analyzePageState(
    snapshot,
    "Does the page indicate an item was successfully added to the cart?",
  );
  console.log(`[Add to cart] ${analysis.verdict}: ${analysis.reasoning}`);
  expect(analysis.verdict).not.toBe("fail");

  await page.goto("/checkout");
  snapshot = await getPageSnapshot(page);
  analysis = await analyzePageState(
    snapshot,
    "Is this a checkout page with fields for shipping or payment information?",
  );
  console.log(`[Checkout] ${analysis.verdict}: ${analysis.reasoning}`);
  expect(analysis.verdict).toBe("pass");

  // Standard form filling - mechanical interactions don't need AI reasoning
  await page.getByLabel(/email/i).fill("test@example.com");
  await page.getByLabel(/first name/i).fill("Test");
  await page.getByLabel(/last name/i).fill("User");
  await page
    .getByLabel(/address/i)
    .first()
    .fill("123 Main St");

  await page.getByRole("button", { name: /place order|complete|pay/i }).click();
  await page.waitForURL(/confirmation|success|thank/i, { timeout: 15000 });

  snapshot = await getPageSnapshot(page);
  analysis = await analyzePageState(
    snapshot,
    `Did the checkout succeed? Look for: order number, thank-you message,
    receipt summary, or email confirmation notice. Flag any error messages
    or payment failure text.`,
  );
  console.log(`[Confirmation] ${analysis.verdict}: ${analysis.reasoning}`);
  expect(analysis.verdict).toBe("pass");
});
```

The "what button should I click" pattern is worth highlighting. Instead of hardcoding `page.getByText("Add to Cart")`, you ask Claude to infer the label from the page context, then use that string to click. If marketing rewrites the copy to "Get It Now", the test adapts without you touching it.

## Beyond Checkout Flows

The same pattern applies anywhere you care more about outcomes than selectors.

**Search filtering:**

```ts
await page.getByPlaceholder("Search articles…").fill("lambda");
const snapshot = await getPageSnapshot(page);
const analysis = await analyzePageState(
  snapshot,
  "Are the visible articles related to Lambda or AWS? Are any clearly unrelated results showing?",
);
expect(analysis.verdict).toBe("pass");
```

**Form validation:**

```ts
await page.getByRole("button", { name: "Submit" }).click();
const snapshot = await getPageSnapshot(page);
const analysis = await analyzePageState(
  snapshot,
  "Is there a validation error or error message visible on the page?",
);
expect(analysis.verdict).toBe("fail"); // we expect an error here
```

**Post-deploy content check:**

```ts
await page.goto("/");
const snapshot = await getPageSnapshot(page);
const analysis = await analyzePageState(
  snapshot,
  "Does this look like a professional developer portfolio with navigation, a hero section, and links to content?",
);
expect(analysis.verdict).not.toBe("fail");
```

That last one makes a good deploy smoke test - it verifies the page is fundamentally intact without encoding any layout details.

## Tradeoffs

**Speed and cost.** Each `analyzePageState` call takes 1–3 seconds and costs fractions of a cent. A test with four AI assertions adds roughly 5–10 seconds and a penny or two per run. Fine for a staging smoke suite that runs on deploy - not for a test suite running on every commit.

**Reliability.** Claude's responses aren't deterministic. The same question on the same page might occasionally return `uncertain` instead of `pass`. Design for this: use `not.toBe("fail")` for checks where uncertainty is acceptable. Reserve hard `toBe("pass")` for critical success states.

**Debugging.** When a traditional test fails, you know exactly which selector didn't match. When an AI test fails, you get Claude's reasoning string - which is often more useful than a selector mismatch, but it's prose rather than a diff.

## When to Use This

Use this as a **deploy-time smoke layer**: a small number of high-value tests that verify the most important user journeys work on staging before traffic shifts. Can someone land, find what they need, and complete the primary action?

Keep your regular Playwright tests for the mechanical stuff - specific elements rendering, navigation URLs, form validation rules, accessibility checks. Use AI-reasoned assertions for the outcome-level questions that are expensive to encode as selectors and break whenever the UI evolves.

The two together give you fast, precise assertions at the detail level, plus a resilient semantic layer that survives normal UI churn.
