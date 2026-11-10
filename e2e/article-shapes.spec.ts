import { test, expect, type Locator, type Page } from "@playwright/test";

const latestTile = (page: Page) =>
  page.getByRole("link", { name: /latest article/i });

const firstCard = (page: Page) => page.locator("main article a").first();

// Geometry of each shape (attributes sorted) so renderers can be compared.
const geometry = (page: Page, svg: string) =>
  page
    .locator(svg)
    .evaluate((el) =>
      [...el.querySelectorAll("circle, rect, path")].map((shape) =>
        ["cx", "cy", "r", "x", "y", "width", "height", "d", "fill"]
          .map((name) => shape.getAttribute(name))
          .join("|"),
      ),
    );

const transforms = (shapes: Locator) =>
  shapes.evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));

const scattered = async (shapes: Locator) =>
  expect
    .poll(async () => (await transforms(shapes)).every((t) => t !== "none"))
    .toBe(true);

const drifting = (shapes: Locator) =>
  shapes.evaluateAll(
    (els) =>
      els.filter((el) =>
        el
          .getAnimations()
          .some(
            (a) => (a as CSSAnimation).animationName === "article-shape-drift",
          ),
      ).length,
  );

test("the latest article tile shows that article's shapes", async ({
  page,
}) => {
  await page.goto("/");
  const onTile = await geometry(page, "a:has-text('Latest article') svg");
  expect(onTile).toHaveLength(4);

  await page.goto("/articles");
  const onCard = await geometry(page, "main article:first-of-type svg");
  expect(onTile).toEqual(onCard);
});

test("the tile's shapes drift and scatter on hover", async ({ page }) => {
  await page.goto("/");
  const shapes = latestTile(page).locator(".article-shape");
  expect(await drifting(shapes)).toBe(4);

  expect(await transforms(shapes)).toEqual(Array(4).fill("none"));
  await latestTile(page).hover();
  await scattered(shapes);
});

test("the tile's shapes stay still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const running = await latestTile(page)
    .locator(".article-shape")
    .evaluateAll(
      (els) => els.filter((el) => el.getAnimations().length > 0).length,
    );
  expect(running).toBe(0);
});

test("a card's shapes scatter on hover", async ({ page }) => {
  await page.goto("/articles");
  const shapes = firstCard(page).locator(".article-shape");
  expect(await transforms(shapes)).toEqual(Array(4).fill("none"));
  await firstCard(page).hover();
  await scattered(shapes);
});

test("a card's shapes scatter on keyboard focus", async ({ page }) => {
  await page.goto("/articles");
  const card = firstCard(page);
  // Tab until the first card has keyboard focus, so :focus-visible applies.
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press("Tab");
    if (await card.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(card).toBeFocused();
  await scattered(card.locator(".article-shape"));
});

test("a card's shapes don't drift", async ({ page }) => {
  await page.goto("/articles");
  expect(await drifting(firstCard(page).locator(".article-shape"))).toBe(0);
});
