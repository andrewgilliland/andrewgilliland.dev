import { describe, it, expect } from "vitest";
import { filterArticles, getUniqueTags } from "./ArticleSearch";
import type { Article } from "../ArticleCard";

const articles: Article[] = [
  {
    id: "intro-to-aws-lambda",
    title: "Intro to AWS Lambda",
    excerpt: "A beginner's guide to serverless functions on AWS.",
    date: "2024-01-01",
    tags: ["aws", "serverless"],
  },
  {
    id: "intro-to-dynamodb",
    title: "Intro to DynamoDB",
    excerpt: "NoSQL database fundamentals with DynamoDB.",
    date: "2024-02-01",
    tags: ["aws", "dynamodb"],
  },
  {
    id: "intro-to-react",
    title: "Getting Started with React",
    excerpt: "Build UIs with React and TypeScript.",
    date: "2024-03-01",
    tags: ["react", "typescript"],
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
    expect(result[0].id).toBe("intro-to-aws-lambda");
  });

  it("filters by excerpt", () => {
    const result = filterArticles(articles, "NoSQL");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("intro-to-dynamodb");
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
    expect(result[0].id).toBe("intro-to-react");
  });

  describe("selectedTag (exact match)", () => {
    it("returns only articles with an exact tag match", () => {
      const result = filterArticles(articles, "", "aws");
      expect(result).toHaveLength(2);
      result.forEach((a) => expect(a.tags).toContain("aws"));
    });

    it("does not match partial tag names", () => {
      // 'ai' should not match articles tagged 'training' even though 'training' contains 'ai'
      const result = filterArticles(articles, "", "ai");
      expect(result).toHaveLength(0);
    });

    it("combines tag filter and query filter", () => {
      const result = filterArticles(articles, "lambda", "aws");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("intro-to-aws-lambda");
    });

    it("returns all articles when selectedTag is undefined", () => {
      expect(filterArticles(articles, "", undefined)).toHaveLength(3);
    });
  });
});

describe("getUniqueTags", () => {
  it("returns all unique tags sorted alphabetically", () => {
    expect(getUniqueTags(articles)).toEqual([
      "aws",
      "dynamodb",
      "react",
      "serverless",
      "typescript",
    ]);
  });

  it("deduplicates tags that appear in multiple articles", () => {
    const tags = getUniqueTags(articles);
    expect(tags.filter((t) => t === "aws")).toHaveLength(1);
  });

  it("returns an empty array for an empty article list", () => {
    expect(getUniqueTags([])).toEqual([]);
  });
});
