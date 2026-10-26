import { describe, expect, it } from "vitest";
import { ACCENTS, fillClass, neoColorClass, shadowClass } from "./accents";
import { NEON } from "./neonPalette";

describe("accents", () => {
  it("are the neon palette's accent colours", () => {
    const { bg, surface, ...accentColours } = NEON;
    expect([...ACCENTS].sort()).toEqual(Object.keys(accentColours).sort());
  });

  it.each([
    ["neoColorClass", neoColorClass],
    ["shadowClass", shadowClass],
    ["fillClass", fillClass],
  ])("%s gives every accent a class in its own colour", (_, classes) => {
    expect(Object.keys(classes).sort()).toEqual([...ACCENTS].sort());
    for (const accent of ACCENTS) {
      expect(classes[accent]).toMatch(new RegExp(`neon[.-]${accent}\\b`));
    }
  });
});
