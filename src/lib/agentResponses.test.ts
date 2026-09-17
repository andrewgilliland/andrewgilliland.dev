import { describe, expect, it } from "vitest";
import { acceptsMarkdown, createAgentFriendly404 } from "./agentResponses";

describe("acceptsMarkdown", () => {
  it("recognizes Markdown among accepted response types", () => {
    expect(acceptsMarkdown("text/html, text/markdown; q=0.9")).toBe(true);
  });

  it("rejects Markdown with a zero quality value", () => {
    expect(acceptsMarkdown("text/markdown; q=0, text/html")).toBe(false);
  });
});

describe("createAgentFriendly404", () => {
  it("returns a Markdown explanation and sitemap link for a missing page", async () => {
    const request = new Request("https://andrewgilliland.dev/missing", {
      headers: { Accept: "text/markdown" },
    });
    const response = createAgentFriendly404(
      request,
      new Response("HTML error", {
        status: 404,
        headers: { "Content-Type": "text/html" },
      }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(await response.text()).toMatch(
      /requested page does not exist[\s\S]+sitemap-index\.xml/i,
    );
  });

  it("preserves the HTML response when Markdown is not requested", () => {
    const response = new Response("HTML error", { status: 404 });

    expect(
      createAgentFriendly404(
        new Request("https://andrewgilliland.dev/missing"),
        response,
      ),
    ).toBe(response);
  });
});
