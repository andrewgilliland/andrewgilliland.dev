// The article search: what its filters mean and how they travel in the URL.
// The listing page's ArticleSearch renders it; topic links (topicUrl in
// ./urls.ts) write the same URL format, so a topic link always opens the exact
// topic filter. Browser-safe: no astro:content.

import type { ListingItem } from "./catalogue";

export interface ArticleSearchFilters {
  /** Free-text search over titles, excerpts and topics. */
  query: string;
  /** One topic to filter by exactly, or "" for none. */
  topic: string;
}

export const NO_FILTERS: ArticleSearchFilters = { query: "", topic: "" };

const QUERY_PARAM = "q";
const TOPIC_PARAM = "tag";

/** The listing items that match both filters, in listing order. */
export function searchArticles(
  articles: ListingItem[],
  { query, topic }: ArticleSearchFilters,
): ListingItem[] {
  let result = articles;
  if (topic) {
    result = result.filter((a) => a.topics.includes(topic));
  }
  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.topics.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return result;
}

/** Every topic in the listing, once each, alphabetically. */
export function getUniqueTopics(articles: ListingItem[]): string[] {
  return [...new Set(articles.flatMap((a) => a.topics))].sort();
}

/** The `limit` most-used topics, ties broken alphabetically. */
export function getPopularTopics(
  articles: ListingItem[],
  limit: number,
): Set<string> {
  const counts = new Map<string, number>();
  for (const topic of articles.flatMap((a) => a.topics)) {
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([topic]) => topic);
  return new Set(ranked);
}

/**
 * Reads the filters from a location search string. A topic outside
 * `knownTopics` (when given) is dropped, so a stale link shows every article
 * instead of an empty page.
 */
export function readSearch(
  search: string,
  knownTopics?: readonly string[],
): ArticleSearchFilters {
  const params = new URLSearchParams(search);
  const query = (params.get(QUERY_PARAM) ?? "").trim();
  const topic = params.get(TOPIC_PARAM) ?? "";
  const known = !knownTopics || knownTopics.includes(topic);
  return { query, topic: known ? topic : "" };
}

/** The search string for these filters, or "" when there are none. */
export function writeSearch({ query, topic }: ArticleSearchFilters): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set(QUERY_PARAM, query.trim());
  if (topic) params.set(TOPIC_PARAM, topic);
  const search = params.toString();
  return search ? `?${search}` : "";
}
