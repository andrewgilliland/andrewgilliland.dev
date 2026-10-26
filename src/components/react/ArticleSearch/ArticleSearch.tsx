import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import ArticleCard, { type Accent } from "../ArticleCard/ArticleCard";
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

// Set by an inline script on the articles page when the URL has filters, so
// the server-rendered (unfiltered) results stay hidden until they apply.
export const PENDING_ATTRIBUTE = "data-article-search-pending";

export default function ArticleSearch({
  articles,
}: {
  articles: ListingItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [urlApplied, setUrlApplied] = useState(false);

  // The URL is the source of truth on load and on Back/Forward.
  useEffect(() => {
    const applyUrl = () => {
      const { query, topic } = readSearch(
        window.location.search,
        getUniqueTopics(articles),
      );
      setQuery(query);
      setSelectedTopic(topic);
      setUrlApplied(true);
    };
    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [articles]);

  // Runs after the render that shows the URL's filters, so the results are
  // revealed already filtered.
  useEffect(() => {
    if (urlApplied) document.documentElement.removeAttribute(PENDING_ATTRIBUTE);
  }, [urlApplied]);

  // Picking a topic or clearing is navigation, so it gets a history entry;
  // typing replaces the current entry so Back doesn't replay keystrokes.
  const updateUrl = (q: string, topic: string, entry: "push" | "replace") => {
    const url = writeSearch({ query: q, topic }) || window.location.pathname;
    if (entry === "push") history.pushState(null, "", url);
    else history.replaceState(null, "", url);
  };

  const setQueryAndUrl = (value: string) => {
    setQuery(value);
    updateUrl(value, selectedTopic, "replace");
  };

  const toggleTopic = (topic: string) => {
    const next = selectedTopic === topic ? "" : topic;
    setSelectedTopic(next);
    updateUrl(query, next, "push");
  };

  const clearAll = () => {
    setQuery("");
    setSelectedTopic("");
    updateUrl("", "", "push");
  };

  const allTopics = getUniqueTopics(articles);
  const popularTopics = getPopularTopics(articles, COLLAPSED_TOPIC_COUNT);
  const canCollapse = allTopics.length > COLLAPSED_TOPIC_COUNT;
  const emptyLabel = [query.trim() && `“${query.trim()}”`, selectedTopic]
    .filter(Boolean)
    .join(" in ");
  const filtered = searchArticles(articles, { query, topic: selectedTopic });

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
          {(query || selectedTopic) && (
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
          {allTopics.map((topic) => {
            const pressed = selectedTopic === topic;
            // display:none (not just clipped) so hidden topics are not focusable.
            const hiddenOnPhones =
              !showAllTopics && !pressed && !popularTopics.has(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                aria-pressed={pressed}
                className={`${hiddenOnPhones ? "max-sm:hidden" : ""} border-2 px-2.5 py-1 font-mono text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-50 ${
                  pressed
                    ? "neo-shadow neo-press border-neutral-950 bg-neon-pink text-neutral-950 [--neo-color:theme(colors.neon.cyan)] [--neo-hover:2px] [--neo-offset:3px]"
                    : "neo-shadow neo-press border-neutral-600 text-neutral-300 [--neo-color:theme(colors.neon.pink)] [--neo-hover:3px] [--neo-offset:0px] hover:border-neutral-50"
                }`}
              >
                {topic}
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
              : `Show all topics (${allTopics.length})`}
          </button>
        )}
      </div>

      <div data-article-results>
        {filtered.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article, index) => (
              <ArticleCard
                key={article.slug}
                article={article}
                accent={CARD_ACCENTS[index % CARD_ACCENTS.length]}
                featured={index === 0 && query.trim() === "" && !selectedTopic}
              />
            ))}
          </section>
        ) : (
          <p className="py-16 text-center font-mono text-sm text-neutral-400">
            No articles match {emptyLabel}
          </p>
        )}
      </div>
    </>
  );
}
