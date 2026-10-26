import { describe, expect, it } from "vitest";
import type { ListingItem } from "./catalogue";
import {
  NO_FILTERS,
  getPopularTopics,
  getUniqueTopics,
  readSearch,
  searchArticles,
  writeSearch,
} from "./search";

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

const slugs = (list: ListingItem[]) => list.map((a) => a.slug);
const search = (query: string, topic = "") =>
  searchArticles(articles, { query, topic });

describe("searchArticles", () => {
  it("returns every article, in order, when there are no filters", () => {
    expect(searchArticles(articles, NO_FILTERS)).toEqual(articles);
  });

  it("ignores a whitespace-only query", () => {
    expect(search("   ")).toHaveLength(3);
  });

  describe("text query", () => {
    it("matches titles, case-insensitively", () => {
      expect(slugs(search("LAMBDA"))).toEqual(["intro-to-aws-lambda"]);
    });

    it("matches excerpts", () => {
      expect(slugs(search("NoSQL"))).toEqual(["intro-to-dynamodb"]);
    });

    it("matches topics by substring", () => {
      expect(search("aws")).toHaveLength(2);
    });

    it("ignores surrounding spaces", () => {
      expect(slugs(search("  lambda "))).toEqual(["intro-to-aws-lambda"]);
    });

    it("returns nothing when nothing matches", () => {
      expect(search("kubernetes")).toEqual([]);
    });
  });

  describe("topic", () => {
    it("keeps only articles filed under exactly that topic", () => {
      const result = search("", "aws");
      expect(result).toHaveLength(2);
      for (const a of result) expect(a.topics).toContain("aws");
    });

    it("does not match part of a topic name", () => {
      // "ai" must not match an article filed under "training".
      expect(search("", "ai")).toEqual([]);
    });

    it("combines with the text query", () => {
      expect(slugs(search("lambda", "aws"))).toEqual(["intro-to-aws-lambda"]);
      expect(search("aws", "serverless")).toHaveLength(1);
    });
  });
});

describe("getUniqueTopics", () => {
  it("lists each topic once, alphabetically", () => {
    expect(getUniqueTopics(articles)).toEqual([
      "aws",
      "dynamodb",
      "react",
      "serverless",
      "typescript",
    ]);
  });

  it("is empty for no articles", () => {
    expect(getUniqueTopics([])).toEqual([]);
  });
});

describe("getPopularTopics", () => {
  it("returns the most-used topics, ties alphabetical", () => {
    // aws is used twice; the rest once, so ties fall back to a-z.
    expect([...getPopularTopics(articles, 3)]).toEqual([
      "aws",
      "dynamodb",
      "react",
    ]);
  });

  it("returns every topic when the limit exceeds the topic count", () => {
    expect(getPopularTopics(articles, 50).size).toBe(5);
  });
});

describe("readSearch", () => {
  it("reads the text query and the topic", () => {
    expect(readSearch("?q=lambda&tag=aws")).toEqual({
      query: "lambda",
      topic: "aws",
    });
  });

  it("trims the text query", () => {
    expect(readSearch("?q=%20lambda%20").query).toBe("lambda");
  });

  it("treats a missing or empty search as no filters", () => {
    expect(readSearch("")).toEqual(NO_FILTERS);
    expect(readSearch("?q=&tag=")).toEqual(NO_FILTERS);
  });

  it("ignores a topic that is not one of the known topics", () => {
    expect(readSearch("?tag=nope", ["aws", "ai"]).topic).toBe("");
    expect(readSearch("?tag=aws", ["aws", "ai"]).topic).toBe("aws");
  });

  it("keeps old ?q=<topic> links working as a text search", () => {
    expect(readSearch("?q=ai")).toEqual({ query: "ai", topic: "" });
  });
});

describe("writeSearch", () => {
  it("writes both filters", () => {
    expect(writeSearch({ query: "lambda", topic: "aws" })).toBe(
      "?q=lambda&tag=aws",
    );
  });

  it("drops empty and whitespace-only values", () => {
    expect(writeSearch({ query: "  ", topic: "" })).toBe("");
    expect(writeSearch({ query: "", topic: "aws" })).toBe("?tag=aws");
  });

  it("trims the text query", () => {
    expect(writeSearch({ query: " lambda ", topic: "" })).toBe("?q=lambda");
  });

  it("round-trips through readSearch", () => {
    const filters = { query: "type hints", topic: "c++" };
    expect(readSearch(writeSearch(filters))).toEqual(filters);
  });
});
