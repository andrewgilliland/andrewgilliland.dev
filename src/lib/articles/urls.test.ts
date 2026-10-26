import { describe, expect, it } from "vitest";
import { readSearch } from "./search";
import { articleUrl, topicUrl } from "./urls";

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
