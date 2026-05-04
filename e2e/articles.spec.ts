import { test, expect } from "@playwright/test";

test("article search filters by query", async ({ page }) => {
  await page.goto("/articles");
  const input = page.getByPlaceholder("Search articles…");
  await input.fill("lambda");
  await expect(page.getByText(/lambda/i).first()).toBeVisible();
});

test("clearing search restores all articles", async ({ page }) => {
  await page.goto("/articles");
  const input = page.getByPlaceholder("Search articles…");
  await input.fill("lambda");
  await input.fill("");
  await expect(page.locator("article").nth(2)).toBeVisible();
});

test("article page renders a heading", async ({ page }) => {
  await page.goto("/articles/intro-to-aws-lambda");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
