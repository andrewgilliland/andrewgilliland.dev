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
