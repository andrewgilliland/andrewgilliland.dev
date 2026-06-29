import { z } from "astro/zod";

const articleDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const articleDateSchema = z
  .union([
    z.date(),
    z.string().regex(articleDatePattern, "Use YYYY-MM-DD for article dates"),
  ])
  .refine((value) => {
    const parsedDate =
      value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }

    const normalizedUtcMidnight = new Date(
      Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
      ),
    );

    return parsedDate.getTime() === normalizedUtcMidnight.getTime();
  }, "Use a real calendar date at UTC midnight")
  .transform((value) =>
    value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`),
  );

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
  date: articleDateSchema,
  excerpt: z.string(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
