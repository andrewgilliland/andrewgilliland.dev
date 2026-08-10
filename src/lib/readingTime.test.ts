import { describe, expect, it } from "vitest";
import { getReadingTime } from "./readingTime.ts";

describe("getReadingTime", () => {
  it("returns a minimum of one minute for short content", () => {
    expect(getReadingTime("Short article content")).toBe("1 min read");
  });

  it("rounds up based on word count", () => {
    const content = Array.from(
      { length: 201 },
      (_, index) => `word${index}`,
    ).join(" ");

    expect(getReadingTime(content)).toBe("2 min read");
  });
});
