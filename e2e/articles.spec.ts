import { test, expect } from "@playwright/test";

test("article search filters by query", async ({ page }) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  const cards = page.locator("article");
  const total = await cards.count();

  await page.getByPlaceholder("Search articles…").fill("lambda");
  await expect(cards.first()).toBeVisible();
  const matches = await cards.count();
  expect(matches).toBeGreaterThan(0);
  expect(matches).toBeLessThan(total);
  await expect(cards.filter({ hasText: /lambda/i }).first()).toBeVisible();
});

test("article search filters by tag", async ({ page }) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "cdk" }).click();
  const articles = page.locator("article");
  const count = await articles.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(articles.nth(i)).toBeVisible();
  }
  // Tags are now separate from the search input - the input should remain empty
  await expect(page.getByPlaceholder("Search articles…")).toHaveValue("");
  // The URL should reflect the selected tag
  await expect(page).toHaveURL(/tag=cdk/);
});

test("clearing search restores all articles", async ({ page }) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  const input = page.getByPlaceholder("Search articles…");
  await input.fill("lambda");
  await input.fill("");
  await expect(page.locator("article").nth(2)).toBeVisible();
});

test("clear button clears search and restores all articles", async ({
  page,
}) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  const input = page.getByPlaceholder("Search articles…");
  await input.fill("lambda");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(input).toHaveValue("");
  await expect(page.locator("article").nth(2)).toBeVisible();
});

test("article page renders a heading", async ({ page }) => {
  await page.goto("/articles/intro-to-aws-lambda");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("article page links back to the list and dates the article", async ({
  page,
}) => {
  await page.goto("/articles/intro-to-aws-lambda");
  await expect(
    page.getByRole("link", { name: "Back to Articles" }),
  ).toHaveAttribute("href", "/articles");
  await expect(page.locator("header time")).toHaveAttribute(
    "datetime",
    /^\d{4}-\d{2}-\d{2}T/,
  );
});

test("draft article is not publicly accessible", async ({ page }) => {
  const response = await page.goto("/articles/test-draft-fixture");
  expect(response?.status()).toBe(404);
});

test("search with no results shows empty state", async ({ page }) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  await page.getByPlaceholder("Search articles…").fill("xyznotarealquery");
  await expect(page.getByText(/no articles match/i)).toBeVisible();
});

test("tag filter and search query work together", async ({ page }) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  const cards = page.locator("article");
  const input = page.getByPlaceholder("Search articles…");

  await input.fill("lambda");
  const lambdaOnly = await cards.count();
  await input.fill("");
  await page.getByRole("button", { name: "cdk", exact: true }).click();
  const cdkOnly = await cards.count();

  await input.fill("lambda");
  const both = await cards.count();
  expect(both).toBeGreaterThan(0);
  expect(both).toBeLessThanOrEqual(Math.min(lambdaOnly, cdkOnly));
  expect(both).toBeLessThan(Math.max(lambdaOnly, cdkOnly));
});

test("?q= param pre-populates search input on load", async ({ page }) => {
  await page.goto("/articles?q=lambda", { waitUntil: "networkidle" });
  await expect(page.getByPlaceholder("Search articles…")).toHaveValue("lambda");
  await expect(page.locator("article").first()).toBeVisible();
});

test("?tag= param pre-selects tag on load", async ({ page }) => {
  await page.goto("/articles?tag=cdk", { waitUntil: "networkidle" });
  const count = await page.locator("article").count();
  expect(count).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "cdk" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Input stays empty — tag param doesn't fill the text search
  await expect(page.getByPlaceholder("Search articles…")).toHaveValue("");
});

test("?q= and ?tag= params together pre-populate both filters on load", async ({
  page,
}) => {
  await page.goto("/articles?q=lambda&tag=cdk", { waitUntil: "networkidle" });
  await expect(page.getByPlaceholder("Search articles…")).toHaveValue("lambda");
  await expect(page.getByRole("button", { name: "cdk" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test.describe("topic filters on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("show the 12 most-used topics until expanded", async ({ page }) => {
    await page.goto("/articles", { waitUntil: "networkidle" });
    const topics = page.locator("button[aria-pressed]");
    const total = await topics.count();
    expect(total).toBeGreaterThan(12);
    await expect(topics.filter({ visible: true })).toHaveCount(12);

    const toggle = page.getByRole("button", { name: /show all topics/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(topics.filter({ visible: true })).toHaveCount(total);
    await expect(
      page.getByRole("button", { name: /show fewer topics/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("keep the selected topic visible while collapsed", async ({ page }) => {
    await page.goto("/articles?tag=cdk", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "cdk" })).toBeVisible();
  });
});

test("topic filters are all visible on wide screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/articles", { waitUntil: "networkidle" });
  const topics = page.locator("button[aria-pressed]");
  await expect(topics.filter({ visible: true })).toHaveCount(
    await topics.count(),
  );
  await expect(
    page.getByRole("button", { name: /show all topics/i }),
  ).toBeHidden();
});

test("Back steps through picked topics without leaving the page", async ({
  page,
}) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  const topic = (name: string) =>
    page.getByRole("button", { name, exact: true });

  await topic("aws").click();
  await topic("cdk").click();
  await expect(page).toHaveURL(/\?tag=cdk$/);

  await page.goBack();
  await expect(page).toHaveURL(/\?tag=aws$/);
  await expect(topic("aws")).toHaveAttribute("aria-pressed", "true");

  await page.goBack();
  await expect(page).toHaveURL(/\/articles$/);
  await expect(topic("aws")).toHaveAttribute("aria-pressed", "false");
});

test.describe("arriving with filters in the URL", () => {
  // Hold back the page's JS so the server-rendered (unfiltered) list is what
  // the browser has until the search hydrates.
  test.beforeEach(async ({ page }) => {
    await page.route("**/_astro/*.js", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
  });

  test("hides the unfiltered list until the filters apply", async ({
    page,
  }) => {
    await page.goto("/articles?tag=cdk", { waitUntil: "commit" });
    const results = page.locator("[data-article-results]");
    await expect(results).toBeAttached();
    await expect(results).toBeHidden();

    await expect(results).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: "cdk", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("shows the list straight away when there are no filters", async ({
    page,
  }) => {
    await page.goto("/articles", { waitUntil: "commit" });
    await expect(page.locator("[data-article-results]")).toBeVisible();
  });
});
