import { describe, it, expect } from "vitest";
import {
  filterArticles,
  getPopularTopics,
  getUniqueTopics,
} from "./ArticleSearch";
import type { ListingItem } from "../../../lib/articles/catalogue";

const articles: ListingItem[] = [
  {
    slug: "intro-to-aws-lambda",
    title: "Intro to AWS Lambda",
    excerpt: "A beginner's guide to serverless functions on AWS.",
    date: "2024-01-01",
    topics: ["aws", "serverless"],
  },
  {
    slug: "intro-to-dynamodb",
    title: "Intro to DynamoDB",
    excerpt: "NoSQL database fundamentals with DynamoDB.",
    date: "2024-02-01",
    topics: ["aws", "dynamodb"],
  },
  {
    slug: "intro-to-react",
    title: "Getting Started with React",
    excerpt: "Build UIs with React and TypeScript.",
    date: "2024-03-01",
    topics: ["react", "typescript"],
  },
];

describe("filterArticles", () => {
  it("returns all articles when query is empty", () => {
    expect(filterArticles(articles, "")).toHaveLength(3);
  });

  it("returns all articles when query is only whitespace", () => {
    expect(filterArticles(articles, "   ")).toHaveLength(3);
  });

  it("filters by title (case-insensitive)", () => {
    const result = filterArticles(articles, "lambda");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("intro-to-aws-lambda");
  });

  it("filters by excerpt", () => {
    const result = filterArticles(articles, "NoSQL");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("intro-to-dynamodb");
  });

  it("filters by tag substring in query", () => {
    const result = filterArticles(articles, "aws");
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no articles match", () => {
    expect(filterArticles(articles, "kubernetes")).toHaveLength(0);
  });

  it("is case-insensitive for query", () => {
    const result = filterArticles(articles, "REACT");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("intro-to-react");
  });

  describe("selectedTag (exact match)", () => {
    it("returns only articles with an exact tag match", () => {
      const result = filterArticles(articles, "", "aws");
      expect(result).toHaveLength(2);
      result.forEach((a) => expect(a.topics).toContain("aws"));
    });

    it("does not match partial tag names", () => {
      // 'ai' should not match articles tagged 'training' even though 'training' contains 'ai'
      const result = filterArticles(articles, "", "ai");
      expect(result).toHaveLength(0);
    });

    it("combines tag filter and query filter", () => {
      const result = filterArticles(articles, "lambda", "aws");
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("intro-to-aws-lambda");
    });

    it("returns all articles when selectedTag is undefined", () => {
      expect(filterArticles(articles, "", undefined)).toHaveLength(3);
    });

    it("returns all articles when selectedTag is empty string (deselected)", () => {
      expect(filterArticles(articles, "", "")).toHaveLength(3);
    });
  });

  describe("tag deselection", () => {
    it("deselecting a tag (passing empty string) restores all articles", () => {
      // Simulate: tag selected → filtered
      const selected = filterArticles(articles, "", "aws");
      expect(selected).toHaveLength(2);

      // Simulate: same tag clicked again → selectedTag becomes "" → all restored
      const deselected = filterArticles(articles, "", "");
      expect(deselected).toHaveLength(3);
    });

    it("deselecting a tag preserves the active query", () => {
      // Query narrows to 2, tag narrows further to 1
      const withBoth = filterArticles(articles, "aws", "serverless");
      expect(withBoth).toHaveLength(1);

      // Tag deselected — query still active, should return all aws-matching articles
      const tagCleared = filterArticles(articles, "aws", "");
      expect(tagCleared).toHaveLength(2);
    });

    it("switching from one tag to another returns correct subset", () => {
      const awsArticles = filterArticles(articles, "", "aws");
      expect(awsArticles).toHaveLength(2);

      const reactArticles = filterArticles(articles, "", "react");
      expect(reactArticles).toHaveLength(1);
      expect(reactArticles[0].slug).toBe("intro-to-react");
    });

    it("deselecting a tag with no query returns the full list", () => {
      const full = filterArticles(articles, "", "");
      expect(full).toEqual(articles);
    });
  });
});

describe("getUniqueTopics", () => {
  it("returns all unique tags sorted alphabetically", () => {
    expect(getUniqueTopics(articles)).toEqual([
      "aws",
      "dynamodb",
      "react",
      "serverless",
      "typescript",
    ]);
  });

  it("deduplicates tags that appear in multiple articles", () => {
    const tags = getUniqueTopics(articles);
    expect(tags.filter((t) => t === "aws")).toHaveLength(1);
  });

  it("returns an empty array for an empty article list", () => {
    expect(getUniqueTopics([])).toEqual([]);
  });
});

describe("getPopularTopics", () => {
  it("returns the most-used tags, breaking ties alphabetically", () => {
    // aws is used twice; the rest once, so ties fall back to a-z.
    expect([...getPopularTopics(articles, 3)]).toEqual([
      "aws",
      "dynamodb",
      "react",
    ]);
  });

  it("returns every tag when the limit exceeds the tag count", () => {
    expect(getPopularTopics(articles, 50).size).toBe(5);
  });
});
