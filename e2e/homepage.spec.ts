import { test, expect } from "@playwright/test";

test("renders hero heading and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /hi, i'm andrew/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Read Articles" })).toBeVisible();
});

test("renders Browse by Topic marquee", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Browse by Topic")).toBeVisible();
});

test("recent articles section is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Recent Articles")).toBeVisible();
});
