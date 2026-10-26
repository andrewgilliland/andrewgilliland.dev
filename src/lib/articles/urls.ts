// Article and topic URLs, and the article search's URL format. Topic links and
// the article search both go through here, so a topic link always opens the
// exact topic filter rather than a text search. Browser-safe: no astro:content.

export interface ArticleSearchFilters {
  /** Free-text search over titles, excerpts and topics. */
  query: string;
  /** One topic to filter by exactly, or "" for none. */
  topic: string;
}

const QUERY_PARAM = "q";
const TOPIC_PARAM = "tag";

export const articleUrl = (slug: string) => `/articles/${slug}`;

export const topicUrl = (topic: string) =>
  `/articles${writeSearch({ query: "", topic })}`;

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
