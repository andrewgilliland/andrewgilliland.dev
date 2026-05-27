import { test, expect } from "@playwright/test";

test("projects page renders heading", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
});

test("SmartScout project card is visible and links to detail page", async ({
  page,
}) => {
  await page.goto("/projects");
  await page.getByRole("link", { name: /smartscout/i }).click();
  await expect(page).toHaveURL("/projects/smartscout");
});
