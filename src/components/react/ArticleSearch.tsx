import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

type Article = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
};

function ArticleCard({
  article,
  featured,
}: {
  article: Article;
  featured: boolean;
}) {
  return (
    <article className={featured ? "sm:col-span-2" : ""}>
      <a
        href={`/articles/${article.id}`}
        className={`grid overflow-hidden rounded-lg border border-white bg-black text-white no-underline transition-all duration-200 ease-in-out hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[3px_3px_#fff] ${featured ? "min-h-[280px]" : "min-h-[220px]"}`}
      >
        <div className="flex h-full grow flex-col space-y-2 p-6">
          <h2 className="flex-none text-2xl leading-tight">{article.title}</h2>
          <div className="flex-1" />
          <time
            dateTime={article.date}
            className="flex-none text-sm text-gray-400"
          >
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </a>
    </article>
  );
}

export default function ArticleSearch({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  const filtered =
    query.trim() === ""
      ? articles
      : articles.filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.excerpt.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <>
      <div className="pb-4 pt-2">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-pink-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="group absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Trash2 className="h-4 w-4 text-gray-500 transition-colors group-hover:text-white" />
            </button>
          )}
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
