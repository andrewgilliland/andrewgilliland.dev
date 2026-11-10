/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import colors from "tailwindcss/colors";
import ArticleCard from "./ArticleCard";
import type { ListingItem } from "../../../lib/articles/catalogue";

const article: ListingItem = {
  slug: "intro-to-aws-lambda",
  title: "Intro to AWS Lambda",
  excerpt: "A beginner's guide to serverless functions on AWS.",
  date: "2024-01-01",
  topics: ["aws", "serverless"],
};

describe("ArticleCard component", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders title and article link", () => {
    const { container } = render(
      <ArticleCard article={article} featured={false} />,
    );

    const link = container.querySelector("article a");
    expect(link?.getAttribute("href")).toBe(`/articles/${article.slug}`);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      article.title,
    );
  });

  it("renders a time element with the article date", () => {
    const { container } = render(
      <ArticleCard article={article} featured={false} />,
    );

    const time = container.querySelector("time");
    expect(time?.getAttribute("datetime")).toBe(article.date);
    expect((time?.textContent ?? "").length).toBeGreaterThan(0);
  });

  it("applies featured layout class when featured is true", () => {
    const { container } = render(<ArticleCard article={article} featured />);

    const rootArticle = container.querySelector("article");
    expect(rootArticle?.className).toContain("sm:col-span-2");
  });

  it("outlines its article's shapes dark when featured, light otherwise", () => {
    const strokes = (featured: boolean) => {
      const { container } = render(
        <ArticleCard article={article} featured={featured} />,
      );
      const values = [
        ...container.querySelectorAll(".article-shapes [stroke]"),
      ].map((shape) => shape.getAttribute("stroke"));
      cleanup();
      return values;
    };

    expect(strokes(true)).toEqual(Array(4).fill(colors.black));
    expect(strokes(false)).toEqual(Array(4).fill(colors.white));
  });
});
