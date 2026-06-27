import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

interface ArticleFrontmatter {
  title?: string;
  date?: string;
  excerpt?: string;
  draft?: boolean;
  tags?: string[];
}

interface ValidationError {
  file: string;
  errors: string[];
}

const ARTICLES_DIR = join(process.cwd(), "src/content/articles");
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;

function parseFrontmatter(content: string): ArticleFrontmatter {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) throw new Error("No frontmatter found");

  const frontmatterText = match[1];
  const frontmatter: ArticleFrontmatter = {};

  // Simple YAML parser for our use case
  frontmatterText.split("\n").forEach((line) => {
    if (!line.trim()) return;

    if (line.startsWith("title:")) {
      frontmatter.title = line
        .replace(/^title:\s*/, "")
        .replace(/^["']|["']$/g, "");
    } else if (line.startsWith("date:")) {
      frontmatter.date = line.replace(/^date:\s*/, "").trim();
    } else if (line.startsWith("excerpt:")) {
      frontmatter.excerpt = line
        .replace(/^excerpt:\s*/, "")
        .replace(/^["']|["']$/g, "");
    } else if (line.startsWith("draft:")) {
      frontmatter.draft = line.replace(/^draft:\s*/, "").trim() === "true";
    } else if (line.startsWith("tags:")) {
      // Handle tags array - could be on multiple lines or inline
      const rest = frontmatterText.substring(frontmatterText.indexOf("tags:"));
      const tagsMatch = rest.match(/tags:\s*\[([\s\S]*?)\]/);
      if (tagsMatch) {
        frontmatter.tags = tagsMatch[1]
          .split(/[,\n]/)
          .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
          .filter((tag) => tag.length > 0);
      }
    }
  });

  return frontmatter;
}

function validateArticle(
  _filename: string,
  frontmatter: ArticleFrontmatter,
): string[] {
  const errors: string[] = [];

  // Required field: title
  if (!frontmatter.title || frontmatter.title.trim().length === 0) {
    errors.push("Missing or empty 'title' field");
  }

  // Required field: date
  if (!frontmatter.date) {
    errors.push("Missing 'date' field");
  } else {
    const dateObj = new Date(frontmatter.date);
    if (isNaN(dateObj.getTime())) {
      errors.push(`Invalid date format: '${frontmatter.date}'`);
    } else if (!frontmatter.draft) {
      // Only check for future dates on published articles
      const now = new Date();
      if (dateObj > now) {
        errors.push(
          `Date is in the future: '${frontmatter.date}' (current date: ${now.toISOString().split("T")[0]})`,
        );
      }
    }
  }

  // Required field: excerpt
  if (!frontmatter.excerpt || frontmatter.excerpt.trim().length === 0) {
    errors.push("Missing or empty 'excerpt' field");
  }

  // Recommended: tags should not be empty
  if (!frontmatter.tags || frontmatter.tags.length === 0) {
    errors.push("Article has no tags (at least one tag recommended)");
  }

  // Tags should be strings
  if (Array.isArray(frontmatter.tags)) {
    frontmatter.tags.forEach((tag, idx) => {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        errors.push(`Tag at index ${idx} is empty or invalid`);
      }
    });
  }

  return errors;
}

describe("Article Content Validation", () => {
  let validationResults: ValidationError[] = [];

  beforeAll(() => {
    const files = readdirSync(ARTICLES_DIR).filter((f) =>
      /\.(md|mdx)$/.test(f),
    );

    files.forEach((filename) => {
      const filepath = join(ARTICLES_DIR, filename);
      const content = readFileSync(filepath, "utf-8");

      try {
        const frontmatter = parseFrontmatter(content);
        const errors = validateArticle(filename, frontmatter);

        if (errors.length > 0) {
          validationResults.push({ file: filename, errors });
        }
      } catch (error) {
        validationResults.push({
          file: filename,
          errors: [
            `Failed to parse: ${error instanceof Error ? error.message : String(error)}`,
          ],
        });
      }
    });
  });

  it("should have at least some articles to validate", () => {
    const files = readdirSync(ARTICLES_DIR).filter((f) =>
      /\.(md|mdx)$/.test(f),
    );
    expect(files.length).toBeGreaterThan(0);
  });

  it("should have valid frontmatter for all articles", () => {
    if (validationResults.length > 0) {
      const errorMessages = validationResults
        .map(
          (result) =>
            `${result.file}:\n  ${result.errors.map((e) => `• ${e}`).join("\n  ")}`,
        )
        .join("\n\n");

      expect(
        validationResults.length,
        `Found ${validationResults.length} article(s) with validation errors:\n\n${errorMessages}`,
      ).toBe(0);
    }
  });

  it("should have all required frontmatter fields", () => {
    const files = readdirSync(ARTICLES_DIR).filter((f) =>
      /\.(md|mdx)$/.test(f),
    );

    files.forEach((filename) => {
      const filepath = join(ARTICLES_DIR, filename);
      const content = readFileSync(filepath, "utf-8");
      const frontmatter = parseFrontmatter(content);

      expect(frontmatter.title, `${filename} should have title`).toBeDefined();
      expect(frontmatter.date, `${filename} should have date`).toBeDefined();
      expect(
        frontmatter.excerpt,
        `${filename} should have excerpt`,
      ).toBeDefined();
    });
  });

  it("should have at least one tag per article", () => {
    const files = readdirSync(ARTICLES_DIR)
      .filter((f) => /\.(md|mdx)$/.test(f))
      .filter((f) => f !== "test-draft-fixture.md"); // exclude test fixtures

    const articlesWithoutTags = files
      .map((filename) => {
        const filepath = join(ARTICLES_DIR, filename);
        const content = readFileSync(filepath, "utf-8");
        const frontmatter = parseFrontmatter(content);
        return { filename, tags: frontmatter.tags || [] };
      })
      .filter((article) => article.tags.length === 0);

    expect(
      articlesWithoutTags.length,
      `Found ${articlesWithoutTags.length} article(s) without tags: ${articlesWithoutTags.map((a) => a.filename).join(", ")}`,
    ).toBe(0);
  });

  it("should have valid ISO 8601 dates", () => {
    const files = readdirSync(ARTICLES_DIR).filter((f) =>
      /\.(md|mdx)$/.test(f),
    );

    const invalidDates = files
      .map((filename) => {
        const filepath = join(ARTICLES_DIR, filename);
        const content = readFileSync(filepath, "utf-8");
        const frontmatter = parseFrontmatter(content);
        return {
          filename,
          date: frontmatter.date,
          isValid:
            frontmatter.date && !isNaN(new Date(frontmatter.date).getTime()),
        };
      })
      .filter((article) => !article.isValid);

    expect(
      invalidDates.length,
      `Found ${invalidDates.length} article(s) with invalid dates: ${invalidDates.map((a) => `${a.filename} (${a.date})`).join(", ")}`,
    ).toBe(0);
  });

  it("should not have published articles with future dates", () => {
    const files = readdirSync(ARTICLES_DIR).filter((f) =>
      /\.(md|mdx)$/.test(f),
    );

    const now = new Date();
    const futurePublishedArticles = files
      .map((filename) => {
        const filepath = join(ARTICLES_DIR, filename);
        const content = readFileSync(filepath, "utf-8");
        const frontmatter = parseFrontmatter(content);
        const date = frontmatter.date ? new Date(frontmatter.date) : new Date();
        return {
          filename,
          date: frontmatter.date,
          isDraft: frontmatter.draft === true,
          isFuture: date > now,
        };
      })
      .filter((article) => article.isFuture && !article.isDraft);

    expect(
      futurePublishedArticles.length,
      `Found ${futurePublishedArticles.length} published article(s) with future dates: ${futurePublishedArticles.map((a) => `${a.filename} (${a.date})`).join(", ")}`,
    ).toBe(0);
  });
});
