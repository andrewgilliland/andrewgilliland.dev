import { describe, expect, it } from "vitest";
import ArticleCard from "./index";

describe("ArticleCard barrel exports", () => {
  it("re-exports default component", () => {
    expect(typeof ArticleCard).toBe("function");
  });
});
