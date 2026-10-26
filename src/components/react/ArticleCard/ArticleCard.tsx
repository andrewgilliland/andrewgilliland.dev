import { useState } from "react";
import { cardDecoration } from "../../../lib/cardDecoration";
import {
  DARK_SHAPE_STROKE,
  LIGHT_SHAPE_STROKE,
} from "../../../lib/shapeColors";
import { articleTitleTransitionName } from "../../../lib/slug";
import { formatArticleDate } from "../../../lib/date";
import type { ListingItem } from "../../../lib/articles/catalogue";
import { articleUrl } from "../../../lib/articles/urls";
import { neoColorClass, type Accent } from "../../../lib/accents";

function CardDecoration({
  id,
  hovered,
  stroke,
}: {
  id: string;
  hovered: boolean;
  stroke: string;
}) {
  const shapes = cardDecoration(id);

  return (
    <svg
      className="pointer-events-none absolute bottom-0 right-0 select-none"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      overflow="visible"
      aria-hidden="true"
    >
      {shapes.map(({ element, fill, offset }, i) => {
        const Shape = element.tag;
        return (
          <g
            key={i}
            style={{
              transition: "transform 0.3s ease",
              transform: hovered
                ? `translate(${offset.dx.toFixed(1)}px, ${offset.dy.toFixed(1)}px)`
                : "translate(0px, 0px)",
            }}
          >
            <Shape
              {...element.attrs}
              fill={fill}
              stroke={stroke}
              strokeWidth={2}
            />
          </g>
        );
      })}
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
  const [hovered, setHovered] = useState(false);

  return (
    <article className={featured ? "sm:col-span-2" : ""}>
      <a
        href={articleUrl(article.slug)}
        className={`neo-shadow neo-press rise-in relative grid h-full overflow-hidden border-2 border-neutral-50 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-50 ${neoColorClass[accent]} ${
          featured
            ? "min-h-[280px] bg-neon-pink text-neutral-950"
            : "min-h-[220px] bg-neon-surface text-neutral-50"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardDecoration
          id={article.slug}
          hovered={hovered}
          stroke={featured ? DARK_SHAPE_STROKE : LIGHT_SHAPE_STROKE}
        />
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
