import rss from "@astrojs/rss";
import { loadArticleCatalogue } from "@/lib/articles/loadCatalogue";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error("Site URL not configured in astro.config.mjs");
  }

  const { articles } = await loadArticleCatalogue();

  return rss({
    title: "Andrew Gilliland",
    description:
      "A software engineer writing about AWS, Python, and building things on the web.",
    site: context.site,
    items: articles.map((article) => ({
      title: article.title,
      description: article.excerpt,
      pubDate: article.date,
      link: article.url,
    })),
  });
}
