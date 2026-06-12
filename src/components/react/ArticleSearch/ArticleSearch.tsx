import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import ArticleCard, { type Article } from "../ArticleCard";

export function filterArticles(articles: Article[], query: string): Article[] {
  if (query.trim() === "") return articles;
  const q = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function getUniqueTags(articles: Article[]): string[] {
  return [...new Set(articles.flatMap((a) => a.tags))].sort();
}

export default function ArticleSearch({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  const setQueryAndUrl = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  const allTags = getUniqueTags(articles);
  const filtered = filterArticles(articles, query);

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
          {query && (
            <button
              onClick={() => setQueryAndUrl("")}
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
              onClick={() => setQueryAndUrl(query === tag ? "" : tag)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                query === tag
                  ? "border-pink-400 text-pink-400"
                  : "border-gray-600 text-gray-400 hover:border-pink-400 hover:text-pink-400"
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
              featured={index === 0 && query.trim() === ""}
            />
          ))}
        </section>
      ) : (
        <p className="py-16 text-center font-mono text-sm text-gray-500">
          No articles match &ldquo;{query}&rdquo;
        </p>
      )}
    </>
  );
}
