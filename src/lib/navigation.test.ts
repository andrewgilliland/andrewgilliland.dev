import { describe, expect, it } from "vitest";
import { navLinks, navState } from "./navigation";

describe("navState", () => {
  it("marks the exact page, with or without a trailing slash", () => {
    expect(navState("/articles", "/articles")).toBe("page");
    expect(navState("/articles", "/articles/")).toBe("page");
    expect(navState("/", "/")).toBe("page");
  });

  it("marks the section for pages beneath it", () => {
    expect(navState("/articles", "/articles/intro-to-ecs")).toBe("section");
    expect(navState("/about", "/about/resume/")).toBe("section");
  });

  it("does not mark unrelated pages or prefixes of other words", () => {
    expect(navState("/", "/articles")).toBeUndefined();
    expect(navState("/projects", "/articles")).toBeUndefined();
    expect(navState("/about", "/aboutness")).toBeUndefined();
  });
});

describe("navLinks", () => {
  const at = (path: string) =>
    Object.fromEntries(navLinks(path).map((l) => [l.title, l]));

  it("lists the site's pages in menu order", () => {
    expect(navLinks("/").map((l) => [l.title, l.href])).toEqual([
      ["Home", "/"],
      ["Projects", "/projects"],
      ["Articles", "/articles"],
      ["About", "/about"],
    ]);
  });

  it("marks the exact page as the current page", () => {
    expect(at("/projects/").Projects).toMatchObject({
      ariaCurrent: "page",
      active: true,
    });
  });

  it("marks the section being read inside, so it stays highlighted", () => {
    expect(at("/articles/intro-to-amazon-ecs").Articles).toMatchObject({
      ariaCurrent: "true",
      active: true,
    });
  });

  it("leaves every other link unmarked", () => {
    const links = at("/articles/intro-to-amazon-ecs");
    for (const title of ["Home", "Projects", "About"]) {
      expect(links[title]).toMatchObject({
        ariaCurrent: undefined,
        active: false,
      });
    }
  });
});
