import { describe, expect, it } from "vitest";
import {
  polygonPath,
  roundedPolygonPath,
  seededRng,
  starPath,
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

describe("polygonPath", () => {
  it("returns a closed path with one point per side", () => {
    const sides = 6;
    const path = polygonPath(12, 12, 8, sides, 0);

    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith(" Z")).toBe(true);
    expect((path.match(/ L /g) ?? []).length).toBe(sides - 1);
  });

  it("is deterministic for the same inputs", () => {
    expect(polygonPath(12, 12, 8, 5, 30)).toBe(polygonPath(12, 12, 8, 5, 30));
  });
});

describe("starPath", () => {
  it("returns a closed path with alternating outer/inner points", () => {
    const points = 5;
    const path = starPath(12, 12, 8, 4.2, points, 0);

    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith(" Z")).toBe(true);
    expect((path.match(/ L /g) ?? []).length).toBe(points * 2 - 1);
  });

  it("is deterministic for the same inputs", () => {
    expect(starPath(12, 12, 8, 4.2, 5, 15)).toBe(
      starPath(12, 12, 8, 4.2, 5, 15),
    );
  });
});
