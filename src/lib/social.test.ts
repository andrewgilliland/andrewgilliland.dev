import { describe, it, expect, vi } from "vitest";

// The icon imports are React components (SVG). Mock the module so Vitest
// doesn't try to parse JSX without a DOM environment.
vi.mock("../components/react/svg/GitHubIcon", () => ({ default: {} }));
vi.mock("../components/react/svg/LinkedInIcon", () => ({ default: {} }));
vi.mock("../components/react/svg/BlueskyIcon", () => ({ default: {} }));

const { socialLinks } = await import("./social");

describe("socialLinks", () => {
  it("has exactly three entries", () => {
    expect(socialLinks).toHaveLength(3);
  });

  it("every entry has the required fields", () => {
    for (const link of socialLinks) {
      expect(link).toHaveProperty("title");
      expect(link).toHaveProperty("href");
      expect(link).toHaveProperty("bgColor");
      expect(link).toHaveProperty("Icon");
    }
  });

  it("all hrefs are valid URLs", () => {
    for (const link of socialLinks) {
      expect(() => new URL(link.href)).not.toThrow();
    }
  });

  it("includes GitHub, LinkedIn, and Bluesky", () => {
    const titles = socialLinks.map((l) => l.title);
    expect(titles).toContain("GitHub");
    expect(titles).toContain("LinkedIn");
    expect(titles).toContain("Bluesky");
  });

  it("all bgColor values are non-empty Tailwind classes", () => {
    for (const link of socialLinks) {
      expect(link.bgColor).toMatch(/^bg-\w+/);
    }
  });
});
