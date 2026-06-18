/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ArticleSearch from "./ArticleSearch";
import type { Article } from "../ArticleCard";

vi.mock("../ArticleCard", () => ({
  default: ({ article, featured }: { article: Article; featured: boolean }) => (
    <article
      data-testid="article-card"
      data-id={article.id}
      data-featured={featured ? "true" : "false"}
    >
      {article.title}
    </article>
  ),
}));

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

describe("ArticleSearch component", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.history.replaceState(null, "", "/articles");
  });

  it("hydrates query and tag state from URL params", async () => {
    window.history.replaceState(null, "", "/articles?q=lambda&tag=aws");

    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("lambda");
    });

    const awsTag = screen.getByRole("button", { name: "aws" });
    expect(awsTag.className).toContain("border-pink-400");
    expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy();
  });

  it("updates URL when typing query and clears all filters", () => {
    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });
    fireEvent.change(input, { target: { value: "lambda" } });

    expect(window.location.search).toContain("q=lambda");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect((input as HTMLInputElement).value).toBe("");
    expect(window.location.search).toBe("");
  });

  it("toggles tag filter and URL param on repeated click", () => {
    render(<ArticleSearch articles={articles} />);

    const awsTag = screen.getByRole("button", { name: "aws" });

    fireEvent.click(awsTag);
    expect(window.location.search).toContain("tag=aws");

    fireEvent.click(awsTag);
    expect(window.location.search).not.toContain("tag=aws");
  });

  it("marks only the first card as featured when no filters are active", () => {
    render(<ArticleSearch articles={articles} />);

    const cards = screen.getAllByTestId("article-card");
    expect(cards[0].getAttribute("data-featured")).toBe("true");
    expect(cards[1].getAttribute("data-featured")).toBe("false");
    expect(cards[2].getAttribute("data-featured")).toBe("false");
  });

  it("removes featured flag when search query is active", () => {
    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });
    fireEvent.change(input, { target: { value: "aws" } });

    const cards = screen.getAllByTestId("article-card");
    for (const card of cards) {
      expect(card.getAttribute("data-featured")).toBe("false");
    }
  });

  it("shows empty state when no articles match", () => {
    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });
    fireEvent.change(input, { target: { value: "not-a-real-article" } });

    expect(screen.getByText(/No articles match/i)).toBeTruthy();
  });
});
