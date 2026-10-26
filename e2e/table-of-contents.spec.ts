import { test, expect, type Page } from "@playwright/test";

// 13 second- and third-level headings, including nested ones.
const ARTICLE = "/articles/intro-to-aws-lambda";

/** Scroll a heading to the top of the viewport, as reading past it would. */
const readTo = (page: Page, slug: string) =>
  page.evaluate((id) => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, slug);

const slugOf = async (link: ReturnType<Page["locator"]>) =>
  (await link.getAttribute("href"))!.slice(1);

test.describe("desktop table of contents", () => {
  test("marks the section being read as the current location", async ({
    page,
  }) => {
    await page.goto(ARTICLE);
    const links = page.locator("#toc-sidebar [data-toc-link]");
    const third = links.nth(2);
    await readTo(page, await slugOf(third));

    await expect(third).toHaveAttribute("aria-current", "location");
    await expect(
      page.locator('#toc-sidebar [data-toc-link][aria-current="location"]'),
    ).toHaveCount(1);
  });
});

test.describe("mobile table of contents", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens with the current section marked", async ({ page }) => {
    await page.goto(ARTICLE);
    const sheetLinks = page.locator("#mobile-toc [data-toc-link]");
    const target = sheetLinks.nth(3);
    await readTo(page, await slugOf(target));

    await page.getByRole("button", { name: "Open table of contents" }).click();
    await expect(page.locator("#mobile-toc")).toBeVisible();
    await expect(target).toHaveAttribute("aria-current", "location");
  });
});
