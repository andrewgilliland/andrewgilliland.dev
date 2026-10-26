import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { articleSchema, resumeSchema } from "./content/schemas";

const resumeCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/resume" }),
  schema: resumeSchema,
});

const articlesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: articleSchema,
});

export const collections = {
  resume: resumeCollection,
  articles: articlesCollection,
};
