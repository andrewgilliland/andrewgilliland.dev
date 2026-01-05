import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

export default async function ArticlePage({ params }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), "content/blog", `${slug}.md`);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent);
  const html = marked(content);

  return (
    <main className="flex flex-col items-center px-4 py-12">
      <article className="prose w-full max-w-2xl">
        <h1 className="mb-4 text-4xl font-bold text-white">
          {data.title || slug.replace(/-/g, " ")}
        </h1>
        <div
          className="prose prose-h2:text-neutral-100 prose-p:text-neutral-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
