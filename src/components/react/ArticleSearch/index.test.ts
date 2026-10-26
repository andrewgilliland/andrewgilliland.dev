import { describe, expect, it } from "vitest";
import ArticleSearch from "./index";

describe("ArticleSearch barrel exports", () => {
  it("re-exports default component", () => {
    expect(typeof ArticleSearch).toBe("function");
  });
});
