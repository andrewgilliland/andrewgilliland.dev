import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { NEON } from "../neonPalette";
import type { Accent } from "../accents";
import { SHARE_IMAGE_SIZE } from "./shareImages";

// Build-time only: renders the link-preview image for a page in the neon
// brutalist style. Satori draws text as paths, so the result does not depend
// on fonts installed on the build machine.

export interface ShareCard {
  /** Short mono line above the title, e.g. "Article · September 15, 2026". */
  eyebrow: string;
  title: string;
  accent: Accent;
}

const WHITE = "#fafafa";
const MUTED = "#a3a3a3";

const { width: WIDTH, height: HEIGHT } = SHARE_IMAGE_SIZE;

const stripes = (angle: string, [a, b, c] = [25, 50, 75]) =>
  `linear-gradient(${angle}, ${NEON.pink}, ${NEON.pink} ${a}%, ${NEON.emerald} ${a}%, ${NEON.emerald} ${b}%, ${NEON.yellow} ${b}%, ${NEON.yellow} ${c}%, ${NEON.cyan} ${c}%, ${NEON.cyan})`;

// An angled gradient's line runs past a box's corners, so evenly spaced
// stops leave the outer bands short across the box's middle. These stops
// give four bands of equal width along a horizontal line through the
// middle of a width x height box (the site's dividers get the same result
// from a repeating gradient).
const equalBandStops = (
  width: number,
  height: number,
  degrees: number,
): [number, number, number] => {
  const angle = (degrees * Math.PI) / 180;
  const across = width * Math.abs(Math.sin(angle));
  const line = across + height * Math.abs(Math.cos(angle));
  const start = (line - across) / 2;
  const stop = (k: number) => ((start + (across * k) / 4) / line) * 100;
  return [stop(1), stop(2), stop(3)];
};

const STRIPE_BAR = { width: 320, height: 28, degrees: -10 };

type Node = {
  type: string;
  props: { style: Record<string, unknown>; children?: unknown };
};
const div = (style: Record<string, unknown>, children?: unknown): Node => ({
  type: "div",
  props: { style, children },
});

// Resolve through Node so the build works from any working directory.
const resolve = createRequire(import.meta.url).resolve;
const fontFile = (pkg: string, file: string) =>
  readFile(resolve(`${pkg}/files/${file}`));

let fonts: Promise<Parameters<typeof satori>[1]["fonts"]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([
    fontFile(
      "@fontsource/space-grotesk",
      "space-grotesk-latin-700-normal.woff",
    ),
    fontFile(
      "@fontsource/jetbrains-mono",
      "jetbrains-mono-latin-700-normal.woff",
    ),
  ])
    .then(([grotesk, mono]) => [
      {
        name: "Space Grotesk",
        data: grotesk,
        weight: 700 as const,
        style: "normal" as const,
      },
      {
        name: "JetBrains Mono",
        data: mono,
        weight: 700 as const,
        style: "normal" as const,
      },
    ])
    .catch((error) => {
      fonts = undefined; // Let the next card retry instead of caching the failure.
      throw error;
    }));

// Step the title down as it grows, and clamp it to four lines (with an
// ellipsis), so it never runs into the name and stripe at the bottom.
export const titleFontSize = (title: string) =>
  title.length > 70 ? 48 : title.length > 40 ? 56 : 72;

export async function renderShareCard({
  eyebrow,
  title,
  accent,
}: ShareCard): Promise<Buffer> {
  const card = div(
    {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      boxSizing: "border-box",
      padding: 56,
      backgroundColor: NEON.bg,
      fontFamily: "Space Grotesk",
    },
    div(
      {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexGrow: 1,
        padding: 56,
        backgroundColor: NEON.surface,
        border: `4px solid ${WHITE}`,
        boxShadow: `16px 16px 0 0 ${NEON[accent]}`,
      },
      [
        div(
          {
            fontFamily: "JetBrains Mono",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: MUTED,
          },
          eyebrow,
        ),
        div(
          {
            fontSize: titleFontSize(title),
            display: "block",
            lineClamp: 4,
            fontWeight: 700,
            lineHeight: 1.1,
            // Balancing a clamped title spreads it over every line first, so
            // only balance titles short enough to show in full.
            textWrap: title.length > 70 ? "wrap" : "balance",
            color: WHITE,
          },
          title,
        ),
        div(
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          },
          [
            div(
              {
                fontSize: 36,
                fontWeight: 700,
                color: "transparent",
                // "to bottom right" only shows 25%-75% across the middle of
                // the text, so split that range into quarters.
                backgroundImage: stripes("to bottom right", [37.5, 50, 62.5]),
                backgroundClip: "text",
              },
              "Andrew Gilliland",
            ),
            div({
              width: STRIPE_BAR.width,
              height: STRIPE_BAR.height,
              border: `4px solid ${WHITE}`,
              backgroundImage: stripes(
                `${STRIPE_BAR.degrees}deg`,
                equalBandStops(
                  STRIPE_BAR.width,
                  STRIPE_BAR.height,
                  STRIPE_BAR.degrees,
                ),
              ),
            }),
          ],
        ),
      ],
    ),
  );

  const svg = await satori(card as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: await loadFonts(),
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
