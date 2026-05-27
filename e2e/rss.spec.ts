import { test, expect } from "@playwright/test";

test("rss feed returns valid xml", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("xml");
});
