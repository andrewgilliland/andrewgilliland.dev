import { describe, it, expect, beforeAll } from "vitest";
import matter from "gray-matter";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { articleSchema } from "./schemas";

describe("Article Content Validation", () => {
  let files: string[] = [];
  let schemaErrors: string[] = [];
  let parsedArticles: Array<{
    file: string;
    data: {
      title: string;
      date: Date;
      excerpt: string;
      draft: boolean;
      tags: string[];
    };
  }> = [];

  beforeAll(async () => {
    const articlesDir = join(process.cwd(), "src/content/articles");
    files = readdirSync(articlesDir).filter((file) => /\.(md|mdx)$/.test(file));

    files.forEach((file) => {
      const filePath = join(articlesDir, file);
      const content = readFileSync(filePath, "utf-8");

      try {
        const parsed = matter(content);
        const result = articleSchema.safeParse(parsed.data);

        if (!result.success) {
          const issues = result.error.issues
            .map((issue) => {
              const path =
                issue.path.length > 0 ? issue.path.join(".") : "frontmatter";
              return `${path}: ${issue.message}`;
            })
            .join("; ");
          schemaErrors.push(`${file}: ${issues}`);
          return;
        }

        parsedArticles.push({ file, data: result.data });
      } catch (error) {
        schemaErrors.push(
          `${file}: Failed to parse frontmatter: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  });

  it("should load frontmatter with the shared article schema", () => {
    expect(
      schemaErrors.length,
      schemaErrors.length > 0
        ? `Found ${schemaErrors.length} schema error(s):\n${schemaErrors.join("\n")}`
        : undefined,
    ).toBe(0);
  });

  it("should have at least some articles to validate", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("should have all required frontmatter fields", () => {
    parsedArticles.forEach((article) => {
      expect(
        article.data.title,
        `${article.file} should have title`,
      ).toBeTruthy();
      expect(
        article.data.date,
        `${article.file} should have date`,
      ).toBeInstanceOf(Date);
      expect(
        article.data.excerpt,
        `${article.file} should have excerpt`,
      ).toBeTruthy();
      expect(
        Array.isArray(article.data.tags),
        `${article.file} should have tags array`,
      ).toBe(true);
    });
  });

  it("should have at least one tag per article", () => {
    const articlesWithoutTags = parsedArticles
      .filter((article) => article.file !== "test-draft-fixture.md")
      .filter((article) => article.data.tags.length === 0)
      .map((article) => article.file);

    expect(
      articlesWithoutTags.length,
      `Found ${articlesWithoutTags.length} article(s) without tags: ${articlesWithoutTags.join(", ")}`,
    ).toBe(0);
  });

  it("should have valid dates", () => {
    const invalidDates = parsedArticles
      .filter((article) => Number.isNaN(article.data.date.getTime()))
      .map((article) => article.file);

    expect(
      invalidDates.length,
      `Found ${invalidDates.length} article(s) with invalid dates: ${invalidDates.join(", ")}`,
    ).toBe(0);
  });

  it("should not have published articles with future dates", () => {
    const now = new Date();
    const futurePublishedArticles = parsedArticles
      .filter((article) => !article.data.draft)
      .filter((article) => article.data.date > now)
      .map(
        (article) =>
          `${article.file} (${article.data.date.toISOString().split("T")[0]})`,
      );

    expect(
      futurePublishedArticles.length,
      `Found ${futurePublishedArticles.length} published article(s) with future dates: ${futurePublishedArticles.join(", ")}`,
    ).toBe(0);
  });
});
