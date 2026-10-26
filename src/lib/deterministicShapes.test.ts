import { describe, expect, it } from "vitest";
import {
  roundedPolygonPath,
  seededRng,
  strToSeed,
} from "./deterministicShapes";

describe("strToSeed", () => {
  it("returns the same seed for the same string", () => {
    expect(strToSeed("hello")).toBe(strToSeed("hello"));
  });

  it("returns different seeds for different strings", () => {
    expect(strToSeed("hello")).not.toBe(strToSeed("world"));
  });

  it("returns a non-zero seed for an empty string", () => {
    expect(strToSeed("")).toBeGreaterThan(0);
  });
});

describe("seededRng", () => {
  it("produces deterministic sequences for the same seed", () => {
    const a = seededRng(42);
    const b = seededRng(42);

    expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()]);
  });

  it("always returns values in [0, 1)", () => {
    const rng = seededRng(12345);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("treats 0 seed the same as 1", () => {
    const a = seededRng(0);
    const b = seededRng(1);

    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });
});

describe("roundedPolygonPath", () => {
  const triangle = [
    [60, 20],
    [20, 80],
    [100, 80],
  ];

  it("starts with M, uses Q commands, and closes with Z", () => {
    const path = roundedPolygonPath(triangle, 5);

    expect(path.startsWith("M ")).toBe(true);
    expect((path.match(/\bQ\b/g) ?? []).length).toBe(triangle.length);
    expect(path.endsWith(" Z")).toBe(true);
  });

  it("is deterministic for the same points and radius", () => {
    expect(roundedPolygonPath(triangle, 5)).toBe(
      roundedPolygonPath(triangle, 5),
    );
  });
});
