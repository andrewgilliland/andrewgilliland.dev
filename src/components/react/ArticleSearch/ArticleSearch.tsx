import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import ArticleCard, { type Accent } from "../ArticleCard";
import type { ListingItem } from "../../../lib/articles/catalogue";
import {
  getPopularTopics,
  getUniqueTopics,
  readSearch,
  searchArticles,
  writeSearch,
} from "../../../lib/articles/search";

// Offset-shadow colours cycle through the grid; the first card's cyan matches
// the home page's latest-article tile.
const CARD_ACCENTS: Accent[] = ["cyan", "pink", "emerald", "yellow"];

// On phones the topic list collapses to the most-used topics.
const COLLAPSED_TOPIC_COUNT = 12;

export default function ArticleSearch({
  articles,
}: {
  articles: ListingItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showAllTopics, setShowAllTopics] = useState(false);

  useEffect(() => {
    const { query, topic } = readSearch(
      window.location.search,
      getUniqueTopics(articles),
    );
    if (query) setQuery(query);
    if (topic) setSelectedTag(topic);
  }, [articles]);

  const updateUrl = (q: string, tag: string) => {
    const search = writeSearch({ query: q, topic: tag });
    history.replaceState(null, "", search || window.location.pathname);
  };

  const setQueryAndUrl = (value: string) => {
    setQuery(value);
    updateUrl(value, selectedTag);
  };

  const toggleTag = (tag: string) => {
    const next = selectedTag === tag ? "" : tag;
    setSelectedTag(next);
    updateUrl(query, next);
  };

  const clearAll = () => {
    setQuery("");
    setSelectedTag("");
    updateUrl("", "");
  };

  const allTags = getUniqueTopics(articles);
  const popularTags = getPopularTopics(articles, COLLAPSED_TOPIC_COUNT);
  const canCollapse = allTags.length > COLLAPSED_TOPIC_COUNT;
  const filtered = searchArticles(articles, { query, topic: selectedTag });

  return (
    <>
      <div className="pb-10">
        <div className="relative">
          <input
            type="search"
            aria-label="Search articles"
            value={query}
            onChange={(e) => setQueryAndUrl(e.target.value)}
            placeholder="Search articles…"
            data-foley-type="thock"
            className="w-full border-2 border-neutral-50 bg-neon-surface px-4 py-3 pr-12 font-mono text-sm text-neutral-50 placeholder-neutral-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_theme(colors.neon.pink)] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {(query || selectedTag) && (
            <button
              onClick={clearAll}
              aria-label="Clear search"
              className="group absolute right-3 top-1/2 -translate-y-1/2 p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-50"
            >
              <Trash2 className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-neutral-50" />
            </button>
          )}
        </div>
        <div id="topic-filters" className="mt-5 flex flex-wrap gap-2.5">
          {allTags.map((tag) => {
            const pressed = selectedTag === tag;
            // display:none (not just clipped) so hidden topics are not focusable.
            const hiddenOnPhones =
              !showAllTopics && !pressed && !popularTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                aria-pressed={pressed}
                className={`${hiddenOnPhones ? "max-sm:hidden" : ""} border-2 px-2.5 py-1 font-mono text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-50 ${
                  pressed
                    ? "neo-shadow neo-press border-neutral-950 bg-neon-pink text-neutral-950 [--neo-color:theme(colors.neon.cyan)] [--neo-hover:2px] [--neo-offset:3px]"
                    : "neo-shadow neo-press border-neutral-600 text-neutral-300 [--neo-color:theme(colors.neon.pink)] [--neo-hover:3px] [--neo-offset:0px] hover:border-neutral-50"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {canCollapse && (
          <button
            type="button"
            onClick={() => setShowAllTopics((open) => !open)}
            aria-expanded={showAllTopics}
            aria-controls="topic-filters"
            className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-neon-pink underline decoration-2 underline-offset-4 hover:text-neon-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-50 sm:hidden"
          >
            {showAllTopics
              ? "Show fewer topics"
              : `Show all topics (${allTags.length})`}
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              accent={CARD_ACCENTS[index % CARD_ACCENTS.length]}
              featured={index === 0 && query.trim() === "" && !selectedTag}
            />
          ))}
        </section>
      ) : (
        <p className="py-16 text-center font-mono text-sm text-neutral-400">
          No articles match &ldquo;{selectedTag || query}&rdquo;
        </p>
      )}
    </>
  );
}
