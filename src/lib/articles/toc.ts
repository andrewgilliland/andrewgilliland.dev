// An article's table of contents: which of its headings are listed. The
// article page computes this once and hands it to both the desktop sidebar
// and the mobile sheet; an empty list means the page shows no TOC at all.

import type { MarkdownHeading } from "astro";

export interface TocEntry {
  /** The heading's id, so the entry links to `#${slug}`. */
  slug: string;
  text: string;
  /** A third-level heading, indented under the second-level one above it. */
  nested: boolean;
}

const FIRST_LISTED_DEPTH = 2;
const LAST_LISTED_DEPTH = 3;

export function tocEntries(
  headings: readonly Pick<MarkdownHeading, "depth" | "slug" | "text">[],
): TocEntry[] {
  return headings
    .filter(
      (h) => h.depth >= FIRST_LISTED_DEPTH && h.depth <= LAST_LISTED_DEPTH,
    )
    .map((h) => ({
      slug: h.slug,
      text: h.text,
      nested: h.depth === LAST_LISTED_DEPTH,
    }));
}

/** The top share of the viewport where a heading counts as being read. */
const READING_ZONE = 0.3;
/**
 * A heading the browser has just scrolled to can land a fraction of a pixel
 * above the viewport; it still counts as at the top, not as scrolled past.
 */
const AT_TOP_TOLERANCE = 1;

/**
 * Which listed heading is the section being read, given each heading's
 * distance from the top of the viewport (in document order): the topmost
 * heading inside the reading zone, or else the last one scrolled past, or -1
 * before the first one arrives.
 */
export function currentSectionIndex(
  headingTops: readonly number[],
  viewportHeight: number,
): number {
  const zoneBottom = viewportHeight * READING_ZONE;
  let lastPassed = -1;
  for (const [index, top] of headingTops.entries()) {
    if (top >= -AT_TOP_TOLERANCE && top <= zoneBottom) return index;
    if (top < -AT_TOP_TOLERANCE) lastPassed = index;
  }
  return lastPassed;
}
