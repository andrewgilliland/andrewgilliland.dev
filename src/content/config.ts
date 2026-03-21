import { defineCollection, z } from "astro:content";

const notesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    excerpt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const resumeCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().optional(),
  }),
});

const articlesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  notes: notesCollection,
  resume: resumeCollection,
  articles: articlesCollection,
};
