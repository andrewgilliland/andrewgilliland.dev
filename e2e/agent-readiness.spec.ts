import { test, expect } from "@playwright/test";

const AI_CRAWLERS = [
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "DeepSeekBot",
  "ora-agent",
];

test("robots.txt explicitly allows major AI crawlers", async ({ request }) => {
  const response = await request.get("/robots.txt");
  const body = await response.text();

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");

  for (const crawler of AI_CRAWLERS) {
    expect(body).toContain(`User-agent: ${crawler}\nAllow: /`);
  }
});

test("publishes a discoverable OpenAPI document", async ({ page, request }) => {
  const response = await request.get("/openapi.json");
  const specification = await response.json();

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(specification.openapi).toBe("3.1.0");
  expect(specification.paths["/api/county-population.json"].get).toBeDefined();

  await page.goto("/");
  await expect(page.locator('link[rel="service-desc"]')).toHaveAttribute(
    "href",
    "/openapi.json",
  );
});

test("homepage raw HTML contains substantial meaningful content", async ({
  request,
}) => {
  const response = await request.get("/");
  const html = await response.text();
  const meaningfulText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  expect(response.status()).toBe(200);
  expect(meaningfulText.length).toBeGreaterThanOrEqual(500);
  expect(meaningfulText.length / html.length).toBeGreaterThanOrEqual(0.05);
});

test("keeps the HTML 404 response for browser requests", async ({
  request,
}) => {
  const response = await request.get("/__agent-readiness-missing-page", {
    headers: { Accept: "text/html" },
  });

  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toContain("text/html");
  expect(await response.text()).toContain(
    "Looks like this page doesn't exist.",
  );
});
