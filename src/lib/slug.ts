export function toSlug(id: string): string {
  return id.replace(/\.mdx?$/, "");
}
