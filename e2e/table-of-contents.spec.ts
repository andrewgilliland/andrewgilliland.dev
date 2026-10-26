import { test, expect, type Page } from "@playwright/test";

// 13 second- and third-level headings, including nested ones.
const ARTICLE = "/articles/intro-to-aws-lambda";

/**
 * Scroll a heading to the top of the viewport, as reading past it would.
 * Instant, not the site's smooth scrolling, so the test doesn't act mid-scroll.
 */
const readTo = (page: Page, slug: string) =>
  page.evaluate((id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ block: "start", behavior: "instant" });
  }, slug);

const slugOf = async (link: ReturnType<Page["locator"]>) =>
  (await link.getAttribute("href"))!.slice(1);

test.describe("desktop table of contents", () => {
  test("lists exactly the article's second- and third-level headings", async ({
    page,
  }) => {
    await page.goto(ARTICLE);
    const headingIds = await page
      .locator("article.prose :is(h2, h3)[id]")
      .evaluateAll((els) => els.map((el) => `#${el.id}`));
    const hrefs = await page
      .locator("#toc-sidebar [data-toc-link]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));

    expect(headingIds.length).toBeGreaterThan(3);
    expect(hrefs).toEqual(headingIds);
  });

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

  test("choosing a section closes the sheet and jumps to it", async ({
    page,
  }) => {
    await page.goto(ARTICLE);
    await page.getByRole("button", { name: "Open table of contents" }).click();
    const sheet = page.locator("#mobile-toc");
    await expect(sheet).toBeVisible();

    const link = sheet.locator("[data-toc-link]").nth(5);
    const slug = await slugOf(link);
    await link.click();

    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`#${slug}$`));
    await expect(page.locator(`[id="${slug}"]`)).toBeInViewport();
  });

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
