import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://andrewgilliland.dev",
  output: "static",
  integrations: [
    sitemap(),
    react(),
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: {
        theme: "github-dark-high-contrast",
        wrap: true,
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "github-dark-high-contrast",
      wrap: true,
    },
  },
});
