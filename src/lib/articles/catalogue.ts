// The article catalogue: published articles, newest first, each with its URL,
// share image and topics, plus the ranked topics and related-article lookup.
// Pure: built from raw collection entries, so tests can pass fixtures. Pages
// get it through loadArticleCatalogue() in ./loadCatalogue.ts.

import { formatArticleDate } from "../date";
import { shareImageIds, shareImageUrl } from "../og/shareImages";
import { articleUrl } from "./urls";

/** The fields the catalogue reads from an articles collection entry. */
export interface ArticleEntry {
  id: string;
  data: {
    title: string;
    excerpt: string;
    date: Date;
    tags: string[];
    draft: boolean;
  };
}

export interface PublishedArticle<E extends ArticleEntry = ArticleEntry> {
  slug: string;
  url: string;
  shareImage: { id: string; url: string };
  title: string;
  excerpt: string;
  date: Date;
  topics: string[];
  /** The raw entry, for render(). Read article fields from the properties above. */
  entry: E;
}

export interface TopicCount {
  topic: string;
  count: number;
}

/** What the article search shows for each article. Serializable for the client. */
export interface ListingItem {
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  /** ISO 8601 timestamp, for `<time datetime>`. */
  date: string;
  /** The date as readers see it ("September 16, 2026"). */
  formattedDate: string;
  topics: string[];
}

/** Everything the article search shows. Serializable for the client. */
export interface Listing {
  /** Published articles, newest first. */
  articles: ListingItem[];
  /** Their topics, most-used first, ties alphabetical. */
  topics: TopicCount[];
}

export interface ArticleCatalogue<E extends ArticleEntry = ArticleEntry> {
  /** Published articles, newest first. */
  articles: PublishedArticle<E>[];
  /** Topics of published articles, most-used first, ties alphabetical. */
  topics: TopicCount[];
  /** Up to `limit` other published articles, most shared topics first, then newest. */
  related(article: PublishedArticle<E>, limit: number): PublishedArticle<E>[];
  /** What the article search shows: `articles` as listing items, and `topics`. */
  listing: Listing;
}

const toPublished = <E extends ArticleEntry>(entry: E): PublishedArticle<E> => {
  const slug = entry.id;
  const shareImageId = shareImageIds.article(slug);
  return {
    slug,
    url: articleUrl(slug),
    shareImage: { id: shareImageId, url: shareImageUrl(shareImageId) },
    title: entry.data.title,
    excerpt: entry.data.excerpt,
    date: entry.data.date,
    topics: entry.data.tags,
    entry,
  };
};

const rankTopics = (articles: PublishedArticle[]): TopicCount[] => {
  const counts = new Map<string, number>();
  for (const topic of articles.flatMap((a) => a.topics)) {
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  return [...counts]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
};

export function createArticleCatalogue<E extends ArticleEntry>(
  entries: readonly E[],
): ArticleCatalogue<E> {
  const articles = entries
    .filter((entry) => !entry.data.draft)
    .map(toPublished)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const topics = rankTopics(articles);

  return {
    articles,
    topics,
    related(article, limit) {
      // Shared topics dominate; the date term only breaks ties between them.
      const score = (candidate: PublishedArticle<E>) =>
        candidate.topics.filter((t) => article.topics.includes(t)).length * 10 +
        candidate.date.getTime() / 1_000_000_000_000;
      return articles
        .filter((candidate) => candidate.slug !== article.slug)
        .map((candidate) => ({ candidate, score: score(candidate) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ candidate }) => candidate);
    },
    listing: {
      articles: articles.map((a) => ({
        slug: a.slug,
        url: a.url,
        title: a.title,
        excerpt: a.excerpt,
        date: a.date.toISOString(),
        formattedDate: formatArticleDate(a.date),
        topics: a.topics,
      })),
      topics,
    },
  };
}
