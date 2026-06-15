import { describe, it, expect } from "vitest";
import { strToSeed, seededRng } from "./ArticleCard";

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
