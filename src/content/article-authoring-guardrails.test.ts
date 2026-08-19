import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Article authoring guardrails", () => {
  it("should provide a site-aligned article template with required frontmatter and sections", () => {
    const templatePath = join(
      process.cwd(),
      ".github/skills/blog-writing-style/references/article-template.md",
    );

    expect(existsSync(templatePath), "Article template should exist").toBe(
      true,
    );

    const template = readFileSync(templatePath, "utf8");

    expect(template).toContain("title:");
    expect(template).toContain("date:");
    expect(template).toContain("excerpt:");
    expect(template).toContain("draft:");
    expect(template).toContain("tags:");

    expect(template).toContain("## Why This Matters");
    expect(template).toContain("## When Not to Use This");
    expect(template).toContain("## The Short Version");
    expect(template).not.toContain("## Conclusion");
  });
});
