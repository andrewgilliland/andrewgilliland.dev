/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx,astro}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx,astro}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx,astro}",
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ["var(--font-space-grotesk)"],
        mono: ["var(--font-jetbrains-mono)"],
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
