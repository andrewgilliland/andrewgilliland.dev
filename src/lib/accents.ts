// The four neon accents and the Tailwind classes that apply them. Class names
// are written out in full so Tailwind finds them (src/lib is in its content
// paths). Raw hex values, for SVG and share images, are in ./neonPalette.ts.

export const ACCENTS = ["pink", "emerald", "yellow", "cyan"] as const;

export type Accent = (typeof ACCENTS)[number];

/** Colour of the `neo-shadow` offset shadow (used on hover and press). */
export const neoColorClass: Record<Accent, string> = {
  pink: "[--neo-color:theme(colors.neon.pink)]",
  emerald: "[--neo-color:theme(colors.neon.emerald)]",
  yellow: "[--neo-color:theme(colors.neon.yellow)]",
  cyan: "[--neo-color:theme(colors.neon.cyan)]",
};

/** An 8px offset shadow that stays put, for tiles that don't move. */
export const shadowClass: Record<Accent, string> = {
  pink: "shadow-[8px_8px_0_0_theme(colors.neon.pink)]",
  emerald: "shadow-[8px_8px_0_0_theme(colors.neon.emerald)]",
  yellow: "shadow-[8px_8px_0_0_theme(colors.neon.yellow)]",
  cyan: "shadow-[8px_8px_0_0_theme(colors.neon.cyan)]",
};

/** An accent background; pair it with dark text for contrast. */
export const fillClass: Record<Accent, string> = {
  pink: "bg-neon-pink",
  emerald: "bg-neon-emerald",
  yellow: "bg-neon-yellow",
  cyan: "bg-neon-cyan",
};
