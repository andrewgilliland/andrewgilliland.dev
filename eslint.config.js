import eslintPluginAstro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";

export default [
  ...eslintPluginAstro.configs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
  },
  {
    // Articles are read only through the article catalogue, which excludes drafts.
    files: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.astro"],
    ignores: ["src/lib/articles/loadCatalogue.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='getCollection'][arguments.0.value='articles']",
          message:
            "Read articles through loadArticleCatalogue() in src/lib/articles/loadCatalogue.ts, which excludes drafts.",
        },
      ],
    },
  },
  {
    ignores: ["dist/", ".astro/", "node_modules/", "playwright-report/"],
  },
];
