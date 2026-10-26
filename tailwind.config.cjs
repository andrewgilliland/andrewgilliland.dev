/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx,astro}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx,astro}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx,astro}",
    // Data files carry class names too (e.g. project logo sizes).
    "./src/data/**/*.{js,ts}",
    // So do some lib modules (e.g. the accent classes in src/lib/accents.ts).
    "./src/lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ["var(--font-space-grotesk)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
      // Neon brutalist palette (docs/design-inspiration.md, direction 1).
      // Accent text on dark surfaces passes WCAG AA; on accent fills use
      // neutral-950 text, never white.
      colors: {
        neon: {
          bg: "#0a0a0a",
          surface: "#171717",
          pink: "#ec4899",
          emerald: "#6ee7b7",
          yellow: "#fde047",
          cyan: "#67e8f9",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
  safelist: [
    {
      pattern:
        /(bg|text)-(yellow|pink|cyan|emerald|red)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /(h|w)-(10|11|12|14|16|24|full)/,
    },
    {
      pattern: /(border|fill|stroke)-(white|black)/,
    },
  ],
};
