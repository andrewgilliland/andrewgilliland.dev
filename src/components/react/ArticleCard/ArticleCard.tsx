import type { CSSProperties } from "react";
import { articleShapes } from "../../../lib/articleShapes";
import { articleTitleTransitionName } from "../../../lib/slug";
import { formatArticleDate } from "../../../lib/date";
import type { ListingItem } from "../../../lib/articles/catalogue";
import { articleUrl } from "../../../lib/articles/urls";
import { neoColorClass, type Accent } from "../../../lib/accents";

// The article's shapes, as ArticleShapes.astro draws them. They scatter on
// hover and focus because the SVG is the card link's direct child.
function ArticleShapes({
  slug,
  tone,
}: {
  slug: string;
  tone: "dark" | "light";
}) {
  const { className, size, shapes } = articleShapes(slug, { tone });

  return (
    <svg
      className={`${className} pointer-events-none absolute bottom-0 right-0 select-none`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
      aria-hidden="true"
    >
      {shapes.map(({ tag: Shape, attrs, fill, stroke, style }, i) => (
        <g key={i} className="article-shape" style={style as CSSProperties}>
          <Shape {...attrs} fill={fill} stroke={stroke} />
        </g>
      ))}
    </svg>
  );
}

export default function ArticleCard({
  article,
  featured,
  accent = "pink",
}: {
  article: ListingItem;
  featured: boolean;
  /** Colour of the offset shadow. */
  accent?: Accent;
}) {
  return (
    <article className={featured ? "sm:col-span-2" : ""}>
      <a
        href={articleUrl(article.slug)}
        className={`neo-shadow neo-press rise-in relative grid h-full overflow-hidden border-2 border-neutral-50 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-50 ${neoColorClass[accent]} ${
          featured
            ? "min-h-[280px] bg-neon-pink text-neutral-950"
            : "min-h-[220px] bg-neon-surface text-neutral-50"
        }`}
      >
        <ArticleShapes slug={article.slug} tone={featured ? "dark" : "light"} />
        <div className="flex h-full grow flex-col space-y-2 p-6">
          <h2
            className={`flex-none pr-6 font-bold leading-tight ${featured ? "text-3xl md:text-4xl" : "text-2xl"}`}
            style={{
              viewTransitionName: articleTitleTransitionName(article.slug),
            }}
          >
            {article.title}
          </h2>
          <div className="flex-1" />
          <div
            className={`flex-none font-mono text-xs uppercase tracking-[0.2em] ${featured ? "text-neutral-900" : "text-neutral-400"}`}
          >
            {featured && "Latest · "}
            <time dateTime={article.date}>
              {formatArticleDate(article.date)}
            </time>
          </div>
        </div>
      </a>
    </article>
  );
}
