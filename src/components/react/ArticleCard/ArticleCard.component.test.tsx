/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ArticleCard, { type Article } from "./ArticleCard";

const article: Article = {
  id: "intro-to-aws-lambda",
  title: "Intro to AWS Lambda",
  excerpt: "A beginner's guide to serverless functions on AWS.",
  date: "2024-01-01",
  tags: ["aws", "serverless"],
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
    expect(link?.getAttribute("href")).toBe(`/articles/${article.id}`);
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

  it("updates decoration transform on hover and resets on mouse leave", () => {
    const { container } = render(
      <ArticleCard article={article} featured={false} />,
    );

    const link = container.querySelector("article a") as HTMLAnchorElement;
    const firstShape = container.querySelector("svg g") as SVGGElement;

    expect(firstShape.style.transform).toBe("translate(0px, 0px)");

    fireEvent.mouseEnter(link);
    expect(firstShape.style.transform).not.toBe("translate(0px, 0px)");

    fireEvent.mouseLeave(link);
    expect(firstShape.style.transform).toBe("translate(0px, 0px)");
  });

  it("renders deterministic decoration for the same article id", () => {
    const first = render(<ArticleCard article={article} featured={false} />);
    const firstSvg = first.container.querySelector("svg")?.innerHTML;
    first.unmount();

    const second = render(<ArticleCard article={article} featured={false} />);
    const secondSvg = second.container.querySelector("svg")?.innerHTML;

    expect(firstSvg).toBe(secondSvg);
  });
});
