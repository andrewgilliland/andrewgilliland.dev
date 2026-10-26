// The only place that reads the articles collection. Everything else asks the
// catalogue, so drafts can't leak into a page that forgets to filter them
// (enforced by the no-restricted-syntax rule in eslint.config.js).

import { getCollection } from "astro:content";
import { createArticleCatalogue } from "./catalogue";

export const loadArticleCatalogue = async () =>
  createArticleCatalogue(await getCollection("articles"));
