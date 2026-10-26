import { describe, expect, it } from "vitest";
import ArticleSearch, { filterArticles, getUniqueTopics } from "./index";

describe("ArticleSearch barrel exports", () => {
  it("re-exports default component", () => {
    expect(typeof ArticleSearch).toBe("function");
  });

  it("re-exports filter helpers", () => {
    expect(typeof filterArticles).toBe("function");
    expect(typeof getUniqueTopics).toBe("function");
  });
});
