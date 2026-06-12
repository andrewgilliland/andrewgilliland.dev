import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import ArticleCard, { type Article } from "../ArticleCard";

export function filterArticles(
  articles: Article[],
  query: string,
  selectedTag?: string,
): Article[] {
  let result = articles;

  if (selectedTag) {
    result = result.filter((a) => a.tags.includes(selectedTag));
  }

  if (query.trim() !== "") {
    const q = query.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return result;
}

export function getUniqueTags(articles: Article[]): string[] {
  return [...new Set(articles.flatMap((a) => a.tags))].sort();
}

export default function ArticleSearch({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const tag = params.get("tag");
    if (q) setQuery(q);
    if (tag) setSelectedTag(tag);
  }, []);

  const updateUrl = (q: string, tag: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
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
    history.replaceState(null, "", window.location.pathname);
  };

  const allTags = getUniqueTags(articles);
  const filtered = filterArticles(articles, query, selectedTag);

  return (
    <>
      <div className="pb-4 pt-2">
        <div className="relative">
          <input
            type="search"
            aria-label="Search articles"
            value={query}
            onChange={(e) => setQueryAndUrl(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-pink-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {(query || selectedTag) && (
            <button
              onClick={clearAll}
              aria-label="Clear search"
              className="group absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Trash2 className="h-4 w-4 text-gray-500 transition-colors group-hover:text-white" />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-all duration-100 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(255,255,255,0.35)] ${
                selectedTag === tag
                  ? "border-pink-400 text-pink-400"
                  : "border-white/35 text-gray-400"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {filtered.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              featured={index === 0 && query.trim() === "" && !selectedTag}
            />
          ))}
        </section>
      ) : (
        <p className="py-16 text-center font-mono text-sm text-gray-500">
          No articles match &ldquo;{selectedTag || query}&rdquo;
        </p>
      )}
    </>
  );
}
