import { describe, it, expect } from "vitest";
import { toSlug } from "./slug";

describe("toSlug", () => {
  it("strips .md extension", () => {
    expect(toSlug("my-article.md")).toBe("my-article");
  });

  it("strips .mdx extension", () => {
    expect(toSlug("data-visualization.mdx")).toBe("data-visualization");
  });

  it("leaves a string without an extension unchanged", () => {
    expect(toSlug("my-article")).toBe("my-article");
  });

  it("handles nested paths by only stripping the extension", () => {
    expect(toSlug("articles/my-article.md")).toBe("articles/my-article");
  });
});
