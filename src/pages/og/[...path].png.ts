import type { APIRoute, GetStaticPaths } from "astro";
import { projects } from "@/data/projects";
import { formatArticleDate } from "@/lib/date";
import { loadArticleCatalogue } from "@/lib/articles/loadCatalogue";
import { renderShareCard, type ShareCard } from "@/lib/og/shareCard";
import { shareImageIds } from "@/lib/og/shareImages";

// Link-preview images, generated at build time: /og/default.png,
// /og/articles/<slug>.png, and /og/projects/<slug>.png.

export const getStaticPaths = (async () => {
  const { articles } = await loadArticleCatalogue();

  const cards: { path: string; card: ShareCard }[] = [
    {
      path: shareImageIds.default,
      card: {
        eyebrow: "Software engineer · Bloomington, IL",
        title: "Writing about AWS, Python, and building things on the web.",
        accent: "pink",
      },
    },
    ...articles.map((article) => ({
      path: article.shareImage.id,
      card: {
        eyebrow: `Article · ${formatArticleDate(article.date)}`,
        title: article.title,
        accent: "cyan" as const,
      },
    })),
    ...projects.map((project) => ({
      path: shareImageIds.project(project.href),
      card: {
        eyebrow: "Case study",
        title: project.title,
        accent: "emerald" as const,
      },
    })),
  ];

  return cards.map(({ path, card }) => ({ params: { path }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(
    new Uint8Array(await renderShareCard((props as { card: ShareCard }).card)),
    {
      headers: { "Content-Type": "image/png" },
    },
  );
