import { beforeAll, describe, expect, it } from "vitest";
import { formatArticleDate } from "./date";

describe("formatArticleDate", () => {
  beforeAll(() => {
    // Article dates are UTC midnight; a US time zone would show the day
    // before if the formatter used local time.
    process.env.TZ = "America/Chicago";
  });

  it("formats the calendar date the article was published on", () => {
    expect(formatArticleDate(new Date("2026-09-16T00:00:00.000Z"))).toBe(
      "September 16, 2026",
    );
  });
});
