import { test, expect } from "@playwright/test";

test("navigates to articles page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Articles" }).first().click();
  await expect(page).toHaveURL("/articles");
});

test("navigates to about page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About" }).first().click();
  await expect(page).toHaveURL("/about");
});
