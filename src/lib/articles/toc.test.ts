import { describe, expect, it } from "vitest";
import { currentSectionIndex, tocEntries } from "./toc";

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

describe("currentSectionIndex", () => {
  // Headings' distances from the top of an 800px viewport; the reading zone is
  // the top 30% (0-240px).
  const VIEWPORT = 800;

  it("is the topmost heading inside the reading zone", () => {
    // Jumping to a heading that is followed closely by a subsection must mark
    // the heading, not the subsection.
    expect(currentSectionIndex([-900, 0, 90, 700], VIEWPORT)).toBe(1);
  });

  it("is the last heading scrolled past when none is in the zone", () => {
    expect(currentSectionIndex([-900, -300, 500], VIEWPORT)).toBe(1);
  });

  it("is -1 before the first heading reaches the zone", () => {
    expect(currentSectionIndex([400, 900], VIEWPORT)).toBe(-1);
    expect(currentSectionIndex([], VIEWPORT)).toBe(-1);
  });

  it("counts a heading on the zone's lower edge as inside it", () => {
    expect(currentSectionIndex([-50, 240], VIEWPORT)).toBe(1);
  });
});
