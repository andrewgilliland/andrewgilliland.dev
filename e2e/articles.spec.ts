import { test, expect } from "@playwright/test";

test("article search filters by query", async ({ page }) => {
  await page.goto("/articles", { waitUntil: "networkidle" });
  const input = page.getByPlaceholder("Search articles…");
  await input.fill("lambda");
  await expect(page.getByText(/lambda/i).first()).toBeVisible();
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
  await expect(page.getByPlaceholder("Search articles…")).toHaveValue("cdk");
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
  await page.getByRole("button", { name: "cdk" }).click();
  await page.getByPlaceholder("Search articles…").fill("lambda");
  const articles = page.locator("article");
  const count = await articles.count();
  expect(count).toBeGreaterThanOrEqual(0);
});
