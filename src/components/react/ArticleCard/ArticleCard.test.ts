import { describe, it, expect } from "vitest";
import { strToSeed, seededRng, roundedPolygonPath } from "./ArticleCard";

describe("strToSeed", () => {
  it("returns the same seed for the same string", () => {
    expect(strToSeed("hello")).toBe(strToSeed("hello"));
  });

  it("returns different seeds for different strings", () => {
    expect(strToSeed("hello")).not.toBe(strToSeed("world"));
  });

  it("returns a positive integer", () => {
    const seed = strToSeed("test");
    expect(seed).toBeGreaterThan(0);
    expect(Number.isInteger(seed)).toBe(true);
  });

  it("returns a non-zero value for an empty string", () => {
    expect(strToSeed("")).toBe(5381);
  });

  it("is sensitive to character order", () => {
    expect(strToSeed("abc")).not.toBe(strToSeed("cba"));
  });
});

describe("seededRng", () => {
  it("produces the same sequence for the same seed", () => {
    const rng1 = seededRng(42);
    const rng2 = seededRng(42);
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = seededRng(1);
    const rng2 = seededRng(2);
    expect(rng1()).not.toBe(rng2());
  });

  it("always returns values in [0, 1)", () => {
    const rng = seededRng(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("is deterministic across multiple calls", () => {
    const rng = seededRng(99);
    const sequence = Array.from({ length: 5 }, () => rng());
    const rng2 = seededRng(99);
    const sequence2 = Array.from({ length: 5 }, () => rng2());
    expect(sequence).toEqual(sequence2);
  });

  it("falls back to seed 1 for a zero seed", () => {
    const rng0 = seededRng(0);
    const rng1 = seededRng(1);
    expect(rng0()).toBe(rng1());
  });
});

describe("strToSeed + seededRng integration", () => {
  it("produces a stable first value for a known article id", () => {
    const rng = seededRng(strToSeed("data-visualization-with-d3.mdx"));
    expect(rng()).toBe(0.7328456409741193);
  });

  it("produces a stable sequence for a known article id", () => {
    const rng = seededRng(strToSeed("data-visualization-with-d3.mdx"));
    expect([rng(), rng(), rng()]).toEqual([
      0.7328456409741193, 0.6490557885263115, 0.4031097625847906,
    ]);
  });

  it("different article ids produce different sequences", () => {
    const rng1 = seededRng(strToSeed("data-visualization-with-d3.mdx"));
    const rng2 = seededRng(strToSeed("aws-glossary.md"));
    expect(rng1()).not.toBe(rng2());
  });

  it("same id always produces the same sequence regardless of call site", () => {
    const id = "building-a-rest-api-with-api-gateway-and-lambda.md";
    const a = seededRng(strToSeed(id));
    const b = seededRng(strToSeed(id));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

const triangle = [
  [60, 20],
  [20, 80],
  [100, 80],
];

const diamond = [
  [60, 20],
  [100, 60],
  [60, 100],
  [20, 60],
];

describe("roundedPolygonPath", () => {
  it("always starts with M and ends with Z", () => {
    const path = roundedPolygonPath(triangle, 5);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("produces one segment per point (M for first, L for rest)", () => {
    const triPath = roundedPolygonPath(triangle, 5);
    expect((triPath.match(/\bM\b/g) ?? []).length).toBe(1);
    expect((triPath.match(/\bL\b/g) ?? []).length).toBe(2);

    const diamondPath = roundedPolygonPath(diamond, 5);
    expect((diamondPath.match(/\bM\b/g) ?? []).length).toBe(1);
    expect((diamondPath.match(/\bL\b/g) ?? []).length).toBe(3);
  });

  it("uses quadratic bezier curves (Q) for rounded corners", () => {
    const path = roundedPolygonPath(triangle, 5);
    expect((path.match(/\bQ\b/g) ?? []).length).toBe(triangle.length);
  });

  it("snapshot: triangle with r=5", () => {
    expect(roundedPolygonPath(triangle, 5)).toBe(
      "M 62.8 24.2 Q 60.0 20.0 57.2 24.2 L 22.8 75.8 Q 20.0 80.0 25.0 80.0 L 95.0 80.0 Q 100.0 80.0 97.2 75.8 Z",
    );
  });

  it("snapshot: diamond with r=5", () => {
    expect(roundedPolygonPath(diamond, 5)).toBe(
      "M 56.5 23.5 Q 60.0 20.0 63.5 23.5 L 96.5 56.5 Q 100.0 60.0 96.5 63.5 L 63.5 96.5 Q 60.0 100.0 56.5 96.5 L 23.5 63.5 Q 20.0 60.0 23.5 56.5 Z",
    );
  });

  it("clamps corner radius when r exceeds half the shortest edge", () => {
    const path = roundedPolygonPath(triangle, 9999);
    expect(path).not.toContain("NaN");
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("handles r=0 (produces degenerate Q commands at the vertex point)", () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const path = roundedPolygonPath(square, 0);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path).not.toContain("NaN");
  });

  it("is deterministic - same input always produces same output", () => {
    expect(roundedPolygonPath(triangle, 5)).toBe(
      roundedPolygonPath(triangle, 5),
    );
  });
});
