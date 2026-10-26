import { test, expect } from "@playwright/test";

test("rss feed returns valid xml", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("xml");
});

test("rss feed lists published articles only", async ({ request }) => {
  const body = await (await request.get("/rss.xml")).text();
  expect(body).toContain("<link>");
  expect(body).not.toContain("test-draft-fixture");
  expect(body).not.toContain("Test Draft Fixture");
});

test("no draft gets a share image", async ({ request }) => {
  const response = await request.get("/og/articles/test-draft-fixture.png");
  expect(response.status()).toBe(404);
});
