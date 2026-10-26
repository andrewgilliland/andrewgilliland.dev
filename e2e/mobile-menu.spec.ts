import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

for (const path of [
  "/",
  "/articles",
  "/articles/intro-to-amazon-ecs",
  "/projects",
  "/projects/smartscout",
  "/about",
  "/about/resume",
  "/this-page-does-not-exist",
]) {
  test(`the open mobile menu sits above the page content on ${path}`, async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toHaveAttribute("class", /translate-y-0/);
    // Wait for the slide-down transition to settle.
    await expect
      .poll(() => menu.evaluate((el) => el.getBoundingClientRect().top))
      .toBeGreaterThan(0);

    // Every link in the menu is the topmost element at its own centre.
    for (const link of await menu.getByRole("link").all()) {
      const box = (await link.boundingBox())!;
      const onTop = await page.evaluate(
        ([x, y]) =>
          document.elementFromPoint(x, y)?.closest("#mobile-menu") !== null,
        [box.x + box.width / 2, box.y + box.height / 2],
      );
      expect(onTop, await link.textContent()).toBe(true);
    }
  });
}

test.describe("mobile menu", () => {
  const toggle = (page: Page) =>
    page.getByRole("button", { name: "Toggle menu" });
  const focusIsInMenu = (page: Page) =>
    page.evaluate(() => !!document.activeElement?.closest("#mobile-menu"));

  test("its links can't be reached while it is closed", async ({ page }) => {
    await page.goto("/articles/intro-to-amazon-ecs");
    await toggle(page).focus();
    await page.keyboard.press("Tab");
    expect(await focusIsInMenu(page)).toBe(false);
  });

  test("opening it makes the links reachable; Escape closes it and returns focus", async ({
    page,
  }) => {
    await page.goto("/articles/intro-to-amazon-ecs");
    await expect(toggle(page)).toHaveAttribute("aria-controls", "mobile-menu");

    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    expect(await focusIsInMenu(page)).toBe(true);

    await page.keyboard.press("Escape");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(toggle(page)).toBeFocused();
  });

  test("marks the section being read", async ({ page }) => {
    await page.goto("/articles/intro-to-amazon-ecs");
    await toggle(page).click();
    const articles = page
      .locator("#mobile-menu")
      .getByRole("link", { name: "Articles" });
    await expect(articles).toHaveAttribute("aria-current", "true");
    await expect(articles).toHaveClass(/bg-neon-pink/);
  });
});
