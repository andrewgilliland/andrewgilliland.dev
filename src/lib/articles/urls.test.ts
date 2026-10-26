import { describe, expect, it } from "vitest";
import { articleUrl, readSearch, topicUrl, writeSearch } from "./urls";

const searchOf = (href: string) => new URL(href, "https://example.com").search;

describe("articleUrl", () => {
  it("links an article by its slug", () => {
    expect(articleUrl("intro-to-amazon-ecs")).toBe(
      "/articles/intro-to-amazon-ecs",
    );
  });
});

describe("topicUrl", () => {
  it("links to the articles listing filtered to exactly that topic", () => {
    expect(topicUrl("aws")).toBe("/articles?tag=aws");
  });

  it("encodes topics that are not URL-safe", () => {
    expect(topicUrl("c++")).toBe("/articles?tag=c%2B%2B");
  });

  it("round-trips through readSearch as the same topic, not a text search", () => {
    for (const topic of ["ai", "c++", "machine learning"]) {
      expect(readSearch(searchOf(topicUrl(topic)))).toEqual({
        query: "",
        topic,
      });
    }
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
    expect(readSearch("")).toEqual({ query: "", topic: "" });
    expect(readSearch("?q=&tag=")).toEqual({ query: "", topic: "" });
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
