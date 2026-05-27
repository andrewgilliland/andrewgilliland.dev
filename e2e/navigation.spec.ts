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

test("navigates to projects page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Projects" }).first().click();
  await expect(page).toHaveURL("/projects");
});

test("logo link navigates to homepage", async ({ page }) => {
  await page.goto("/articles");
  await page.getByRole("link", { name: "Andrew Gilliland" }).click();
  await expect(page).toHaveURL("/");
});
