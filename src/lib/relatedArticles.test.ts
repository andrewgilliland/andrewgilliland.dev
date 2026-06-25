import { describe, expect, it } from "vitest";
import {
  getRelatedArticles,
  type RelatedArticleInput,
} from "./relatedArticles";

interface TestArticle extends RelatedArticleInput {
  data: RelatedArticleInput["data"] & {
    title: string;
  };
}

function article(
  id: string,
  tags: string[],
  date: string,
  title = id,
): TestArticle {
  return {
    id,
    data: {
      title,
      tags,
      date: new Date(date),
    },
  };
}

describe("getRelatedArticles", () => {
  it("excludes the current article", () => {
    const current = article("current", ["aws"], "2026-06-01");
    const all = [current, article("other", ["aws"], "2026-06-02")];

    const result = getRelatedArticles(current, all, 3);

    expect(result.map((item) => item.id)).toEqual(["other"]);
  });

  it("prioritizes shared tags over recency", () => {
    const current = article("current", ["aws", "testing"], "2026-06-01");
    const recentNoMatch = article("recent", ["python"], "2026-06-20");
    const olderWithMatch = article("older-match", ["aws"], "2026-06-02");

    const result = getRelatedArticles(
      current,
      [current, recentNoMatch, olderWithMatch],
      2,
    );

    expect(result.map((item) => item.id)).toEqual(["older-match", "recent"]);
  });

  it("uses recency as a tiebreaker when shared-tag counts match", () => {
    const current = article("current", ["aws"], "2026-06-01");
    const older = article("older", ["aws"], "2026-06-02");
    const newer = article("newer", ["aws"], "2026-06-10");

    const result = getRelatedArticles(current, [current, older, newer], 2);

    expect(result.map((item) => item.id)).toEqual(["newer", "older"]);
  });

  it("respects the limit", () => {
    const current = article("current", ["aws"], "2026-06-01");
    const all = [
      current,
      article("a", ["aws"], "2026-06-02"),
      article("b", ["aws"], "2026-06-03"),
      article("c", ["aws"], "2026-06-04"),
    ];

    const result = getRelatedArticles(current, all, 2);

    expect(result).toHaveLength(2);
  });
});
