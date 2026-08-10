export function getReadingTime(content: string): string {
  const cleaned = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_~\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned ? cleaned.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}
