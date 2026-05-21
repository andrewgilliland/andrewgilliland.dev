import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

type Article = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
};

function strToSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function seededRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 4294967296;
  };
}

type ShapeType = "circle" | "rect" | "triangle" | "diamond";
const SHAPES: ShapeType[] = ["circle", "rect", "triangle", "diamond"];

interface ShapeProps {
  type: ShapeType;
  cx: number;
  cy: number;
  size: number;
  fill: string;
  rotate: number;
}

function renderShape(
  { type, cx, cy, size, fill, rotate }: ShapeProps,
  key: number,
) {
  const shared = { fill, stroke: "white", strokeWidth: 2 };
  const t = `rotate(${rotate} ${cx} ${cy})`;

  if (type === "circle") {
    return <circle key={key} {...shared} cx={cx} cy={cy} r={size} />;
  }
  if (type === "rect") {
    return (
      <rect
        key={key}
        {...shared}
        x={cx - size}
        y={cy - size}
        width={size * 2}
        height={size * 2}
        transform={t}
      />
    );
  }
  if (type === "triangle") {
    const pts = [
      [cx, cy - size],
      [cx - size * 0.866, cy + size * 0.5],
      [cx + size * 0.866, cy + size * 0.5],
    ]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    return <polygon key={key} {...shared} points={pts} transform={t} />;
  }
  // diamond
  const pts = [
    [cx, cy - size],
    [cx + size, cy],
    [cx, cy + size],
    [cx - size, cy],
  ]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  return <polygon key={key} {...shared} points={pts} transform={t} />;
}

function CardDecoration({ id }: { id: string }) {
  const rng = seededRng(strToSeed(id));
  const rand = (min: number, max: number) => min + rng() * (max - min);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const colors = ["#f9a8d4", "#67e8f9", "#6ee7b7", "#fde047"];
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  const shapes: ShapeProps[] = [
    {
      type: pick(SHAPES),
      cx: rand(70, 108),
      cy: rand(70, 108),
      size: rand(55, 78),
      fill: colors[0],
      rotate: rand(0, 45),
    },
    {
      type: pick(SHAPES),
      cx: rand(36, 72),
      cy: rand(62, 98),
      size: rand(35, 54),
      fill: colors[1],
      rotate: rand(0, 45),
    },
    {
      type: pick(SHAPES),
      cx: rand(60, 102),
      cy: rand(32, 70),
      size: rand(24, 42),
      fill: colors[2],
      rotate: rand(0, 45),
    },
    {
      type: pick(SHAPES),
      cx: rand(30, 65),
      cy: rand(36, 68),
      size: rand(14, 27),
      fill: colors[3],
      rotate: rand(0, 45),
    },
  ];

  return (
    <svg
      className="pointer-events-none absolute bottom-0 right-0 select-none"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      {shapes.map((s, i) => renderShape(s, i))}
    </svg>
  );
}

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
        className={`relative grid overflow-hidden rounded-lg border border-white bg-black text-white no-underline transition-all duration-200 ease-in-out hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[3px_3px_#fff] ${featured ? "min-h-[280px]" : "min-h-[220px]"}`}
      >
        <CardDecoration id={article.id} />
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

  const allTags = [...new Set(articles.flatMap((a) => a.tags))].sort();

  const filtered =
    query.trim() === ""
      ? articles
      : articles.filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.excerpt.toLowerCase().includes(query.toLowerCase()) ||
            a.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
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
        <div className="mt-3 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(query === tag ? "" : tag)}
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
