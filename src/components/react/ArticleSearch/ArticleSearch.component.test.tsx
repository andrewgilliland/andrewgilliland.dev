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
import type { ListingItem } from "../../../lib/articles/catalogue";

vi.mock("../ArticleCard", () => ({
  default: ({
    article,
    featured,
  }: {
    article: ListingItem;
    featured: boolean;
  }) => (
    <article
      data-testid="article-card"
      data-id={article.slug}
      data-featured={featured ? "true" : "false"}
    >
      {article.title}
    </article>
  ),
}));

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
    expect(awsTag.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy();
  });

  it("hydrates only tag from URL when query is absent", async () => {
    window.history.replaceState(null, "", "/articles?tag=aws");

    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("");
    });

    const awsTag = screen.getByRole("button", { name: "aws" });
    expect(awsTag.getAttribute("aria-pressed")).toBe("true");
    expect(window.location.search).toContain("tag=aws");
  });

  it("adds the Foley typing cue to the search input", () => {
    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });
    expect(input.getAttribute("data-foley-type")).toBe("thock");
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
    expect(awsTag.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(awsTag);
    expect(window.location.search).not.toContain("tag=aws");
    expect(awsTag.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
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

  describe("browser history", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("adds a history entry when a topic is picked or cleared", () => {
      const push = vi.spyOn(window.history, "pushState");
      render(<ArticleSearch articles={articles} />);

      fireEvent.click(screen.getByRole("button", { name: "aws" }));
      expect(push).toHaveBeenLastCalledWith(null, "", "?tag=aws");

      fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
      expect(push).toHaveBeenLastCalledWith(null, "", "/articles");
      expect(push).toHaveBeenCalledTimes(2);
    });

    it("replaces the entry while typing, so Back doesn't replay keystrokes", () => {
      const push = vi.spyOn(window.history, "pushState");
      render(<ArticleSearch articles={articles} />);

      const input = screen.getByRole("searchbox", { name: "Search articles" });
      fireEvent.change(input, { target: { value: "la" } });
      fireEvent.change(input, { target: { value: "lambda" } });

      expect(push).not.toHaveBeenCalled();
      expect(window.location.search).toBe("?q=lambda");
    });

    it("restores the filters from the URL on Back and Forward", async () => {
      render(<ArticleSearch articles={articles} />);

      window.history.pushState(null, "", "/articles?tag=react");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await waitFor(() => {
        expect(
          screen
            .getByRole("button", { name: "react" })
            .getAttribute("aria-pressed"),
        ).toBe("true");
      });
      expect(screen.getAllByTestId("article-card")).toHaveLength(1);

      window.history.replaceState(null, "", "/articles");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await waitFor(() => {
        expect(screen.getAllByTestId("article-card")).toHaveLength(3);
      });
      expect(
        screen
          .getByRole("button", { name: "react" })
          .getAttribute("aria-pressed"),
      ).toBe("false");
    });
  });

  it("ignores a topic in the URL that no article has", async () => {
    window.history.replaceState(null, "", "/articles?tag=not-a-topic");

    render(<ArticleSearch articles={articles} />);

    await waitFor(() => {
      expect(screen.getAllByTestId("article-card")).toHaveLength(3);
    });
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("matches a query with surrounding spaces", () => {
    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });
    fireEvent.change(input, { target: { value: "lambda " } });

    const cards = screen.getAllByTestId("article-card");
    expect(cards.map((c) => c.getAttribute("data-id"))).toEqual([
      "intro-to-aws-lambda",
    ]);
  });

  it("shows empty state when no articles match", () => {
    render(<ArticleSearch articles={articles} />);

    const input = screen.getByRole("searchbox", { name: "Search articles" });
    fireEvent.change(input, { target: { value: "not-a-real-article" } });

    expect(screen.getByText(/No articles match/i)).toBeTruthy();
  });
});
