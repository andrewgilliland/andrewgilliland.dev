// Article and topic URLs. Topic URLs use the article search's own URL format
// (./search.ts), so a topic link always opens the exact topic filter rather
// than a text search. Browser-safe: no astro:content.

import { writeSearch } from "./search";

export const articleUrl = (slug: string) => `/articles/${slug}`;

export const topicUrl = (topic: string) =>
  `/articles${writeSearch({ query: "", topic })}`;
