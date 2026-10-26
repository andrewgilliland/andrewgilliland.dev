import { describe, expect, it } from "vitest";
import { createArticleCatalogue, type ArticleEntry } from "./catalogue";

const entry = (
  id: string,
  date: string,
  tags: string[],
  extra: Partial<ArticleEntry["data"]> = {},
): ArticleEntry => ({
  id,
  data: {
    title: `Title of ${id}`,
    excerpt: `Excerpt of ${id}`,
    date: new Date(`${date}T00:00:00.000Z`),
    tags,
    draft: false,
    ...extra,
  },
});

const entries = [
  entry("intro-to-ecs", "2024-03-01", ["aws", "docker"]),
  entry("intro-to-lambda", "2024-05-01", ["aws", "serverless"]),
  entry("react-hooks", "2024-01-01", ["react"]),
  entry("secret-draft", "2025-01-01", ["aws", "ai"], { draft: true }),
  entry("ai-testing", "2024-04-01", ["ai", "testing"]),
];

describe("article catalogue", () => {
  const catalogue = createArticleCatalogue(entries);
  const slugs = (list: { slug: string }[]) => list.map((a) => a.slug);

  it("lists published articles only, newest first", () => {
    expect(slugs(catalogue.articles)).toEqual([
      "intro-to-lambda",
      "ai-testing",
      "intro-to-ecs",
      "react-hooks",
    ]);
  });

  it("gives each article its url and share image", () => {
    const [lambda] = catalogue.articles;
    expect(lambda.url).toBe("/articles/intro-to-lambda");
    expect(lambda.shareImage).toEqual({
      id: "articles/intro-to-lambda",
      url: "/og/articles/intro-to-lambda.png",
    });
  });

  it("exposes title, excerpt, date and topics, and keeps the entry for rendering", () => {
    const ecs = catalogue.articles.find((a) => a.slug === "intro-to-ecs")!;
    expect(ecs).toMatchObject({
      title: "Title of intro-to-ecs",
      excerpt: "Excerpt of intro-to-ecs",
      date: new Date("2024-03-01T00:00:00.000Z"),
      topics: ["aws", "docker"],
    });
    expect(ecs.entry).toBe(entries[0]);
  });

  it("ranks topics by article count, then alphabetically, ignoring drafts", () => {
    expect(catalogue.topics).toEqual([
      { topic: "aws", count: 2 },
      { topic: "ai", count: 1 },
      { topic: "docker", count: 1 },
      { topic: "react", count: 1 },
      { topic: "serverless", count: 1 },
      { topic: "testing", count: 1 },
    ]);
  });

  it("produces the listing items the article search shows, newest first", () => {
    expect(catalogue.listing[0]).toEqual({
      slug: "intro-to-lambda",
      title: "Title of intro-to-lambda",
      excerpt: "Excerpt of intro-to-lambda",
      date: "2024-05-01T00:00:00.000Z",
      topics: ["aws", "serverless"],
    });
    expect(slugs(catalogue.listing)).toEqual(slugs(catalogue.articles));
  });

  describe("related articles", () => {
    const bySlug = (slug: string) =>
      catalogue.articles.find((a) => a.slug === slug)!;

    it("ranks shared topics first, then recency, and never includes the article itself", () => {
      expect(slugs(catalogue.related(bySlug("intro-to-ecs"), 3))).toEqual([
        "intro-to-lambda",
        "ai-testing",
        "react-hooks",
      ]);
    });

    it("respects the limit", () => {
      expect(catalogue.related(bySlug("intro-to-ecs"), 1)).toHaveLength(1);
    });

    it("never suggests a draft", () => {
      const related = catalogue.related(bySlug("ai-testing"), 10);
      expect(slugs(related)).not.toContain("secret-draft");
    });
  });

  it("is empty when every article is a draft", () => {
    const empty = createArticleCatalogue([
      entry("only-draft", "2024-01-01", ["aws"], { draft: true }),
    ]);
    expect(empty.articles).toEqual([]);
    expect(empty.topics).toEqual([]);
    expect(empty.listing).toEqual([]);
  });
});
