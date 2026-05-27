import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { toSlug } from "@/lib/slug";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const articles = await getCollection("articles", ({ data }) => !data.draft);

  const sorted = articles.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: "Andrew Gilliland",
    description:
      "A software engineer writing about AWS, Python, and building things on the web.",
    site: context.site!,
    items: sorted.map((article) => ({
      title: article.data.title,
      description: article.data.excerpt,
      pubDate: article.data.date,
      link: `/articles/${toSlug(article.id)}`,
    })),
  });
}
