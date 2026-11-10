/**
 * Formats an article date ("September 16, 2026"). Article dates are stored
 * as UTC midnight, so they are formatted in UTC: local time would show the
 * previous day for readers (and builds) west of UTC.
 */
export function formatArticleDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
