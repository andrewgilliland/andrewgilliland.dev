import { describe, expect, it } from "vitest";
import { tocEntries } from "./toc";

const h = (depth: number, text: string) => ({
  depth,
  text,
  slug: text.toLowerCase().replace(/\s+/g, "-"),
});

describe("tocEntries", () => {
  it("keeps second- and third-level headings, in document order", () => {
    const entries = tocEntries([
      h(1, "Title"),
      h(2, "Setup"),
      h(3, "Install"),
      h(4, "Mac only"),
      h(2, "Deploy"),
    ]);
    expect(entries.map((e) => e.text)).toEqual(["Setup", "Install", "Deploy"]);
  });

  it("links each entry by its heading slug and marks third-level ones nested", () => {
    expect(tocEntries([h(2, "Setup"), h(3, "Install")])).toEqual([
      { slug: "setup", text: "Setup", nested: false },
      { slug: "install", text: "Install", nested: true },
    ]);
  });

  it("is empty when there is nothing to list, so no table of contents shows", () => {
    expect(tocEntries([])).toEqual([]);
    expect(tocEntries([h(1, "Title"), h(4, "Deep detail")])).toEqual([]);
  });
});
