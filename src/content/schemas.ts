import { z } from "astro/zod";

export const notesSchema = z.object({
  title: z.string(),
  date: z.date(),
  excerpt: z.string().optional(),
  draft: z.boolean().default(false),
});

export const resumeSchema = z.object({
  title: z.string().optional(),
});

export const articleSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  excerpt: z.string(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
