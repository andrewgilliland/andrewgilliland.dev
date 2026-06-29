import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { articleSchema, notesSchema, resumeSchema } from "./content/schemas";

const notesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: notesSchema,
});

const resumeCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/resume" }),
  schema: resumeSchema,
});

const articlesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: articleSchema,
});

export const collections = {
  notes: notesCollection,
  resume: resumeCollection,
  articles: articlesCollection,
};
