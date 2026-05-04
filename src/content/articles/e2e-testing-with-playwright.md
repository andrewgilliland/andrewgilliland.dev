---
title: E2E Testing with Playwright
date: 2026-05-04
excerpt: How to add end-to-end tests to a React app with Playwright, including checkout flow testing for e-commerce, and run them automatically on every pull request.
draft: false
tags: ["testing", "playwright", "ci-cd"]
---

Unit tests tell you that your functions work in isolation. E2E tests tell you that your app actually works when a real browser loads it. They catch a different class of failure: build pipeline regressions, broken routing, client-side JavaScript that fails to render, and interactions that depend on the full page rather than a component in isolation.

This article walks through adding Playwright to a React project, writing a focused set of smoke tests, and running them automatically on every pull request with GitHub Actions.

## Why Playwright

Playwright is a strong choice for testing React apps. Its `webServer` config lets you point it at your dev server or preview server, so it starts and stops automatically as part of the test run - no manual server management. It's TypeScript-first with no extra configuration needed. And it uses auto-waiting by default - instead of sprinkling `await waitFor()` calls throughout your tests, Playwright retries assertions until they pass or a timeout is hit, which means tests are less flaky without extra effort.

The other main option is Cypress. Playwright is generally faster, has better multi-browser support in a single run, and tends to have less configuration overhead for most project setups. For a React app there's no meaningful difference in what they can test - Playwright just has less friction to get started.

## Installing Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

The second command downloads the Chromium browser binary that Playwright controls. You can install additional browsers (`firefox`, `webkit`) with the same command, but Chromium alone is sufficient for CI on most projects.

Add a test script to `package.json`:

```json
"test:e2e": "playwright test"
```

## Configuring Playwright

Create `playwright.config.ts` at the root of your project:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

A few things worth explaining here:

**`webServer`** tells Playwright to run `npm run preview` (Vite's preview server) before the tests begin, wait until `localhost:4173` responds, then shut it down when tests finish. `reuseExistingServer: !process.env.CI` means locally it will reuse a server you already have running, but in CI it always starts fresh.

**`forbidOnly: !!process.env.CI`** prevents accidentally committing a `test.only()` call - if Playwright sees one in CI it fails immediately rather than silently running only that test.

**`retries: process.env.CI ? 2 : 0`** retries flaky tests up to 2 times in CI before marking them as failures. Locally you want failures to be immediate.

**`trace: "on-first-retry"`** records a trace (network requests, DOM snapshots, console logs) when a test is retried. You can inspect it with `npx playwright show-report` after a run.

## Writing Smoke Tests

Create an `e2e/` directory and add your first test file.

### Homepage

```ts
// e2e/homepage.spec.ts
import { test, expect } from "@playwright/test";

test("renders homepage heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("renders call to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
});

test("hero section is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
});
```

Notice the selectors: `getByRole("heading")` and `getByRole("link")`. Playwright's role-based locators match the way assistive technologies see the page - they're more resilient to markup changes than CSS selectors and they enforce that elements are semantically correct. If you rename a CSS class, the test still passes. If you accidentally remove the `<h1>`, it fails.

### Navigation

```ts
// e2e/navigation.spec.ts
import { test, expect } from "@playwright/test";

test("navigates to products page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Products" }).first().click();
  await expect(page).toHaveURL("/products");
});

test("navigates to about page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About" }).first().click();
  await expect(page).toHaveURL("/about");
});
```

These tests catch broken routing - if a page slug changes, a route gets deleted, or a link's `href` goes stale. They also implicitly verify that the navbar renders and its links are reachable.

### Testing Interactive Components

This is the highest-value test in the suite. Interactive React components are the most likely place for a build regression to surface silently - the component might fail to render or lose state, and the page would look mostly fine until someone tried to use it.

```ts
// e2e/search.spec.ts
import { test, expect } from "@playwright/test";

test("search filters results by query", async ({ page }) => {
  await page.goto("/products");
  const input = page.getByPlaceholder("Search products…");
  await input.fill("widget");
  await expect(page.getByText(/widget/i).first()).toBeVisible();
});

test("clearing search restores all results", async ({ page }) => {
  await page.goto("/products");
  const input = page.getByPlaceholder("Search products…");
  await input.fill("widget");
  await input.fill("");
  await expect(page.locator("li").nth(2)).toBeVisible();
});

test("product detail page renders a heading", async ({ page }) => {
  await page.goto("/products/some-product");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

`getByPlaceholder` locates the search input by its placeholder text, `fill()` types into it, and then we assert that filtered results appear. The clearing test verifies the reset path - typing and then clearing should restore the full list. If the component's state management breaks, this fails.

## Testing Checkout Flows

For e-commerce sites, the checkout flow is the most critical path to cover with E2E tests. A broken checkout means lost revenue, and it's exactly the kind of multi-step interaction that unit tests can't verify - adding to cart, updating quantities, entering shipping details, and confirming an order all depend on state persisting across multiple pages and components.

### Add to Cart

```ts
// e2e/cart.spec.ts
import { test, expect } from "@playwright/test";

test("adds a product to the cart", async ({ page }) => {
  await page.goto("/products/blue-widget");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
});

test("cart persists across navigation", async ({ page }) => {
  await page.goto("/products/blue-widget");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.goto("/");
  await expect(page.getByTestId("cart-count")).toHaveText("1");
});
```

`getByTestId` locates elements by their `data-testid` attribute. It's the right choice when there's no semantic role or label to target - like a cart badge that's a plain `<span>`. Add `data-testid="cart-count"` to the element in your markup. Unlike `getByRole` and `getByLabel`, it doesn't enforce any accessibility semantics, so use it sparingly and only when a better locator isn't available.

### Checkout Steps

Multi-step checkouts are where E2E tests earn their keep. The test below walks the full flow - cart → shipping → payment → confirmation:

```ts
test("completes checkout flow", async ({ page }) => {
  // Add item to cart
  await page.goto("/products/blue-widget");
  await page.getByRole("button", { name: /add to cart/i }).click();

  // Proceed to checkout
  await page.goto("/cart");
  await page.getByRole("button", { name: /checkout/i }).click();
  await expect(page).toHaveURL("/checkout/shipping");

  // Fill shipping details
  await page.getByLabel("Full name").fill("Jane Smith");
  await page.getByLabel("Address").fill("123 Main St");
  await page.getByLabel("City").fill("Portland");
  await page.getByLabel("ZIP code").fill("97201");
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page).toHaveURL("/checkout/payment");

  // Confirm order success
  await expect(page).toHaveURL(/\/order-confirmation/);
  await expect(
    page.getByRole("heading", { name: /order confirmed/i }),
  ).toBeVisible();
});
```

**`getByLabel`** is the right locator for form fields - it finds the input associated with a `<label>` element, which is both more resilient than targeting by placeholder text and enforces that your labels are correctly wired up.

**Environment isolation**: checkout tests should always run against a dedicated test environment with a test payment gateway - never against production. Use environment variables to control which API keys and endpoints the app uses, and make sure the CI workflow sets the right values.

If your payment UI is a custom form, fill card fields directly with `getByLabel`. If you're using Stripe's embedded `PaymentElement`, the inputs live inside an iframe and require `frameLocator` to reach them:

```ts
// Custom payment form
await page.getByLabel("Card number").fill("4242424242424242");
await page.getByLabel("Expiry").fill("12/29");
await page.getByLabel("CVC").fill("123");

// Stripe PaymentElement (inputs are inside an iframe)
const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
await stripeFrame.getByLabel("Card number").fill("4242424242424242");
await stripeFrame.getByLabel("Expiry").fill("12/29");
await stripeFrame.getByLabel("CVC").fill("123");
```

Use `4242 4242 4242 4242` as your test card number with Stripe - it always succeeds in test mode. Never put real card numbers in tests.

### Handling Authentication

Most checkout flows require a logged-in user. Logging in through the UI before every test is slow. Instead, use Playwright's `storageState` to save a session cookie once and reuse it:

```ts
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.playwright/auth.json");

setup("log in as test user", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: authFile });
});
```

Then update your `playwright.config.ts` to run the setup project first and pass the saved session into your tests:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".playwright/auth.json",
      },
      dependencies: ["setup"],
    },
  ],
});
```

Add `.playwright/` to `.gitignore` so session files aren't committed.

## Running Tests Locally

Since the config uses `npm run preview` (Vite's preview server), you need a production build before running tests:

```bash
npm run build && npm run test:e2e
```

Playwright starts the preview server, runs all tests, then shuts it down. You'll see output like:

```
Running 8 tests using 1 worker

  ✓ homepage > renders homepage heading (0.9s)
  ✓ homepage > renders call to action (0.8s)
  ✓ homepage > hero section is present (0.7s)
  ✓ navigation > navigates to products page (1.1s)
  ✓ navigation > navigates to about page (0.9s)
  ✓ search > search filters results by query (1.4s)
  ✓ search > clearing search restores all results (1.3s)
  ✓ search > product detail page renders a heading (0.8s)

  8 passed (9.3s)
```

**Other useful commands during development:**

```bash
# Interactive UI mode - best for writing new tests
npx playwright test --ui

# Watch the browser as tests run
npx playwright test --headed

# Run a single file
npx playwright test e2e/search.spec.ts

# Open the last HTML report
npx playwright show-report
```

UI mode is the most useful for test development. It gives you a browser-based runner where you can step through tests, inspect the DOM at any point, and use the built-in locator picker to figure out the right selector for an element.

## Adding to CI with GitHub Actions

Create `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm clean-install

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Build app
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

Add `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` as [repository secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) in your repo's Settings → Secrets and variables → Actions.

A few things to note:

**`npm clean-install`** is used instead of `npm install`. `clean-install` (`ci`) installs exact versions from `package-lock.json` and errors if the lockfile is out of sync, which is the right behavior for CI.

**`npx playwright install chromium --with-deps`** installs both the browser binary and its system dependencies (fonts, shared libraries) needed to run headless Chromium on the Ubuntu runner.

**Build runs before tests**. The `webServer` config points at `npm run preview`, which serves the built output from `dist/`. If `Build app` fails, `Run E2E tests` never starts.

The workflow triggers on pull requests targeting `main`, so every PR gets a green/red check before merge.

## The Takeaway

Smoke tests catch broken builds and routing. Checkout flow tests protect the path that actually makes money. Authentication setup via `storageState` keeps the suite fast without skipping login. One workflow runs it all on every PR.

The pattern scales - start with the homepage and a nav test, then add checkout coverage as your critical paths become clear.

For more on GitHub Actions, [Intro to GitHub Actions](/articles/intro-to-github-actions) covers the core concepts of workflows, jobs, and steps. If you want to extend this pattern to deployment - automatically shipping to production after tests pass - [CI/CD for Lambda Functions with GitHub Actions](/articles/ci-cd-for-lambda-functions-with-github-actions) walks through that setup.
