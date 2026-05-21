import { useState } from "react";

export type Article = {
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
  style?: React.CSSProperties,
) {
  const shared = { fill, stroke: "white", strokeWidth: 2 };
  const t = `rotate(${rotate} ${cx} ${cy})`;

  let shape;
  if (type === "circle") {
    shape = <circle {...shared} cx={cx} cy={cy} r={size} />;
  } else if (type === "rect") {
    shape = (
      <rect
        {...shared}
        x={cx - size}
        y={cy - size}
        width={size * 2}
        height={size * 2}
        transform={t}
      />
    );
  } else if (type === "triangle") {
    const pts = [
      [cx, cy - size],
      [cx - size * 0.866, cy + size * 0.5],
      [cx + size * 0.866, cy + size * 0.5],
    ]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    shape = <polygon {...shared} points={pts} transform={t} />;
  } else if (type === "diamond") {
    const pts = [
      [cx, cy - size],
      [cx + size, cy],
      [cx, cy + size],
      [cx - size, cy],
    ]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    shape = <polygon {...shared} points={pts} transform={t} />;
  }

  return (
    <g key={key} style={style}>
      {shape}
    </g>
  );
}

function CardDecoration({ id, hovered }: { id: string; hovered: boolean }) {
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

  const offsets = shapes.map(() => {
    const dir = rng() * Math.PI * 2;
    const mag = 3 + rng() * 5;
    return { dx: Math.cos(dir) * mag, dy: Math.sin(dir) * mag };
  });

  return (
    <svg
      className="pointer-events-none absolute bottom-0 right-0 select-none"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      {shapes.map((s, i) => {
        const { dx, dy } = offsets[i];
        return renderShape(s, i, {
          transition: "transform 0.3s ease",
          transform: hovered
            ? `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
            : "translate(0px, 0px)",
        });
      })}
    </svg>
  );
}

export default function ArticleCard({
  article,
  featured,
}: {
  article: Article;
  featured: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <article className={featured ? "sm:col-span-2" : ""}>
      <a
        href={`/articles/${article.id}`}
        className={`relative grid overflow-hidden rounded-lg border border-white bg-black text-white no-underline transition-all duration-200 ease-in-out hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[3px_3px_#fff] ${featured ? "min-h-[280px]" : "min-h-[220px]"}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardDecoration id={article.id} hovered={hovered} />
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
