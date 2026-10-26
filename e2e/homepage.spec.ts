import { test, expect } from "@playwright/test";

test("renders hero heading and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /hi, i'm andrew/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Read Articles" })).toBeVisible();
});

test("renders Browse by Topic with links to filtered articles", async ({
  page,
}) => {
  await page.goto("/");
  const topics = page.getByRole("region", { name: "Browse by Topic" });
  await expect(topics.getByText("Browse by Topic")).toBeVisible();
  const firstTopic = topics.getByRole("link").first();
  await expect(firstTopic).toHaveAttribute("href", /^\/articles\?tag=/);
});

test("a topic chip opens exactly that topic's articles", async ({ page }) => {
  await page.goto("/");
  const topics = page.getByRole("region", { name: "Browse by Topic" });
  const chip = topics.getByRole("link").first();
  const [, topic, count] = (await chip.innerText())
    .trim()
    .match(/^(.+?)\s+(\d+)$/)!;

  await chip.click();
  await expect(page).toHaveURL(/\/articles\?tag=/);
  await expect(
    page.getByRole("button", { name: topic, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("article")).toHaveCount(Number(count));
});

test("recent articles section is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Recent Articles")).toBeVisible();
});

test("latest article tile opens the newest article", async ({ page }) => {
  await page.goto("/");
  const latest = page.getByRole("link", { name: /latest article/i });
  await expect(latest).toBeVisible();
  await latest.click();
  await expect(page).toHaveURL(/\/articles\/.+/);
});

test("writing tile shows the article count and links to articles", async ({
  page,
}) => {
  await page.goto("/");
  const writing = page.getByRole("link", { name: /writing \d+ articles/i });
  await expect(writing).toHaveAttribute("href", "/articles");
});

test("project tiles link to their case studies", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /manchester united hospitality/i }),
  ).toHaveAttribute("href", "/projects/manchester-united-hospitality");
  await expect(page.getByRole("link", { name: /smartscout/i })).toHaveAttribute(
    "href",
    "/projects/smartscout",
  );
});
