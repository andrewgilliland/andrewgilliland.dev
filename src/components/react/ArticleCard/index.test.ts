import { describe, expect, it } from "vitest";
import ArticleCard, { roundedPolygonPath, seededRng, strToSeed } from "./index";

describe("ArticleCard barrel exports", () => {
  it("re-exports default component", () => {
    expect(typeof ArticleCard).toBe("function");
  });

  it("re-exports utility functions", () => {
    expect(typeof strToSeed).toBe("function");
    expect(typeof seededRng).toBe("function");
    expect(typeof roundedPolygonPath).toBe("function");
  });
});
