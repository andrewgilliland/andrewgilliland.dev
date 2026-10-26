import { describe, it, expect } from "vitest";
import { articleTitleTransitionName } from "./slug";

describe("articleTitleTransitionName", () => {
  it("prefixes the slug so the name never starts with a digit", () => {
    expect(articleTitleTransitionName("intro-to-sqs")).toBe(
      "article-intro-to-sqs",
    );
    expect(articleTitleTransitionName("6-months-of-python")).toBe(
      "article-6-months-of-python",
    );
  });

  it("replaces characters that are not valid in a CSS name", () => {
    expect(articleTitleTransitionName("guides/Intro.To")).toBe(
      "article-guides-intro-to",
    );
  });
});
