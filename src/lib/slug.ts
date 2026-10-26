/**
 * The view-transition-name shared by an article's card title and its page
 * heading, so the title morphs between the two pages.
 */
export function articleTitleTransitionName(slug: string): string {
  return `article-${slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
}
