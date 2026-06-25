export interface RelatedArticleInput {
  id: string;
  data: {
    tags: string[];
    date: Date;
  };
}

export function getRelatedArticles<T extends RelatedArticleInput>(
  currentArticle: T,
  allArticles: T[],
  limit = 3,
): T[] {
  return allArticles
    .filter((candidate) => candidate.id !== currentArticle.id)
    .map((candidate) => {
      const sharedTagCount = candidate.data.tags.filter((tag) =>
        currentArticle.data.tags.includes(tag),
      ).length;
      const recencyScore = candidate.data.date.getTime() / 1_000_000_000_000;

      return {
        candidate,
        score: sharedTagCount * 10 + recencyScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
