/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto-sans)"],
        brand: ["var(--font-space-grotesk)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
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
      pattern: /(h|w)-(10|11|12|14|16|full)/,
    },
    {
      pattern: /(border)-(white|black)/,
    },
  ],
};
