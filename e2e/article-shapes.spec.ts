import { test, expect, type Page } from "@playwright/test";

const latestTile = (page: Page) =>
  page.getByRole("link", { name: /latest article/i });

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

test("the shapes float and scatter on hover", async ({ page }) => {
  await page.goto("/");
  const shapes = latestTile(page).locator(".article-shape");
  const floating = await shapes.evaluateAll((els) =>
    els.filter((el) =>
      el
        .getAnimations()
        .some(
          (a) => (a as CSSAnimation).animationName === "article-shape-drift",
        ),
    ),
  );
  expect(floating).toHaveLength(4);

  const transforms = () =>
    shapes.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).transform),
    );
  expect(await transforms()).toEqual(Array(4).fill("none"));
  await latestTile(page).hover();
  await expect
    .poll(async () => (await transforms()).every((t) => t !== "none"))
    .toBe(true);
});

test("the shapes stay still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const running = await latestTile(page)
    .locator(".article-shape")
    .evaluateAll(
      (els) => els.filter((el) => el.getAnimations().length > 0).length,
    );
  expect(running).toBe(0);
});
