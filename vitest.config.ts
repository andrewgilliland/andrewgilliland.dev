import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**/*.ts",
        "src/types/**/*.ts",
        "src/components/react/ArticleCard/**/*.ts",
        "src/components/react/ArticleCard/**/*.tsx",
        "src/components/react/ArticleSearch/**/*.ts",
        "src/components/react/ArticleSearch/**/*.tsx",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.d.ts",
        "src/env.d.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
