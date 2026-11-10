import colors from "tailwindcss/colors";
import { NEON } from "./neonPalette";

// An article's shapes: four overlapping shapes seeded by its slug, so the
// article shows the same shapes on its card and on the home page's
// latest-article tile. This module decides everything about them (geometry,
// colours, how they move); renderers just draw what it returns. The motion
// itself is the "Article shapes" section of src/styles/motion.css.

type ShapeType = "circle" | "rect" | "triangle" | "diamond";
const SHAPE_TYPES: ShapeType[] = ["circle", "rect", "triangle", "diamond"];

const FILLS = [NEON.pink, NEON.cyan, NEON.emerald, NEON.yellow];

const STROKES = { dark: colors.black, light: colors.white };

const SIZE = 120;

type Attrs = Record<string, number | string>;

export interface ArticleShape {
  tag: "circle" | "rect" | "path";
  /** SVG geometry attributes for `tag`. */
  attrs: Attrs;
  fill: string;
  stroke: string;
  /** CSS custom properties read by the motion stylesheet. */
  style: Record<string, string>;
}

export interface ArticleShapesOptions {
  /** Outline colour: "dark" on light backgrounds, "light" on dark ones. */
  tone: "dark" | "light";
  /** Drift slowly while idle, not just scatter on hover and focus. */
  drift?: boolean;
}

/**
 * Draw the returned SVG (`className`, `size` square) as the first child of a
 * `relative` element: the shapes scatter when that element is hovered or
 * focused, so the SVG must be its direct child.
 */
export function articleShapes(
  slug: string,
  { tone, drift = false }: ArticleShapesOptions,
): { className: string; size: number; shapes: ArticleShape[] } {
  // The order of rng() calls below fixes every article's shapes; changing it
  // reshuffles them on every card.
  const rng = seededRng(strToSeed(slug));
  const rand = (min: number, max: number) => min + rng() * (max - min);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const fills = [...FILLS];
  for (let i = fills.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [fills[i], fills[j]] = [fills[j], fills[i]];
  }

  // [cx range, cy range, size range] from the largest shape to the smallest.
  const slots: [number, number][][] = [
    [
      [70, 108],
      [70, 108],
      [55, 64],
    ],
    [
      [36, 72],
      [62, 98],
      [35, 54],
    ],
    [
      [60, 102],
      [32, 70],
      [24, 42],
    ],
    [
      [30, 65],
      [36, 68],
      [14, 27],
    ],
  ];
  const geometry = slots.map(([cxRange, cyRange, sizeRange]) => {
    const type = pick(SHAPE_TYPES);
    const cx = rand(...cxRange);
    const cy = rand(...cyRange);
    const size = rand(...sizeRange);
    const rotate = rand(0, 45);
    return shapeGeometry(type, cx, cy, size, rotate);
  });

  const shapes = geometry.map(({ tag, attrs }, i) => {
    // How far the shape moves on hover and focus (px).
    const dir = rng() * Math.PI * 2;
    const mag = 3 + rng() * 5;
    const dx = Math.cos(dir) * mag;
    const dy = Math.sin(dir) * mag;
    return {
      tag,
      attrs,
      fill: fills[i],
      stroke: STROKES[tone],
      style: {
        "--dx": `${dx.toFixed(1)}px`,
        "--dy": `${dy.toFixed(1)}px`,
        // Idle drift: perpendicular to the scatter, on staggered loops.
        "--fx": `${(-dy * 0.6).toFixed(1)}px`,
        "--fy": `${(dx * 0.6).toFixed(1)}px`,
        "--float-duration": `${5 + i * 1.3}s`,
        "--float-delay": `${-i * 1.7}s`,
      },
    };
  });

  return {
    className: drift
      ? "article-shapes article-shapes--drift"
      : "article-shapes",
    size: SIZE,
    shapes,
  };
}

function shapeGeometry(
  type: ShapeType,
  cx: number,
  cy: number,
  size: number,
  rotate: number,
): Pick<ArticleShape, "tag" | "attrs"> {
  const transform = `rotate(${rotate} ${cx} ${cy})`;
  const r = size * 0.2;
  if (type === "circle") return { tag: "circle", attrs: { cx, cy, r: size } };
  if (type === "rect") {
    return {
      tag: "rect",
      attrs: {
        x: cx - size,
        y: cy - size,
        width: size * 2,
        height: size * 2,
        rx: r,
        transform,
      },
    };
  }
  const points =
    type === "triangle"
      ? [
          [cx, cy - size],
          [cx - size * 0.866, cy + size * 0.5],
          [cx + size * 0.866, cy + size * 0.5],
        ]
      : [
          [cx, cy - size],
          [cx + size, cy],
          [cx, cy + size],
          [cx - size, cy],
        ];
  return {
    tag: "path",
    attrs: { d: roundedPolygonPath(points, r), transform },
  };
}

/** A deterministic 32-bit unsigned seed for a string (djb2-xor). */
function strToSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

/** A deterministic xorshift PRNG returning values in [0, 1). */
function seededRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 4294967296;
  };
}

function roundedPolygonPath(points: number[][], r: number): string {
  const n = points.length;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const d0x = prev[0] - curr[0];
    const d0y = prev[1] - curr[1];
    const len0 = Math.sqrt(d0x * d0x + d0y * d0y);
    const a0x = curr[0] + (d0x / len0) * Math.min(r, len0 / 2);
    const a0y = curr[1] + (d0y / len0) * Math.min(r, len0 / 2);
    const d1x = next[0] - curr[0];
    const d1y = next[1] - curr[1];
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const a1x = curr[0] + (d1x / len1) * Math.min(r, len1 / 2);
    const a1y = curr[1] + (d1y / len1) * Math.min(r, len1 / 2);
    parts.push(
      `${i === 0 ? "M" : "L"} ${a0x.toFixed(1)} ${a0y.toFixed(1)} Q ${curr[0].toFixed(1)} ${curr[1].toFixed(1)} ${a1x.toFixed(1)} ${a1y.toFixed(1)}`,
    );
  }
  parts.push("Z");
  return parts.join(" ");
}
