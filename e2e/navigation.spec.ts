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

test("marks the current section in the main navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/articles");
  const nav = page.getByRole("navigation", { name: "Main" }).last();
  await expect(nav.getByRole("link", { name: "Articles" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute(
    "aria-current",
  );

  await page.goto("/about/resume");
  await expect(
    page.getByRole("navigation", { name: "Main" }).last().getByRole("link", {
      name: "About",
    }),
  ).toHaveAttribute("aria-current", "true");
});

test("the GitHub badge links to the profile without a made-up star count", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const badge = page.getByRole("link", {
    name: "Visit andrewgilliland on GitHub",
  });
  await expect(badge).toHaveAttribute(
    "href",
    "https://github.com/andrewgilliland",
  );
  await expect(badge).toHaveText("");
});
