import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { BlogPost } from "@/types";

const blogDirectory = path.join(process.cwd(), "content/blog");

export function getBlogPosts(): BlogPost[] {
  // Check if blog directory exists
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const filenames = fs.readdirSync(blogDirectory);
  const posts = filenames
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const filePath = path.join(blogDirectory, name);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug: name.replace(/\.md$/, ""),
        title: data.title || "Untitled",
        date: data.date || "",
        excerpt: data.excerpt || "",
        tags: data.tags || [],
        content,
      } as BlogPost;
    });

  // Sort posts by date (newest first)
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getBlogPost(slug: string): BlogPost | null {
  try {
    const filePath = path.join(blogDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || "Untitled",
      date: data.date || "",
      excerpt: data.excerpt || "",
      tags: data.tags || [],
      content,
      html: marked(content),
    } as BlogPost;
  } catch (error) {
    return null;
  }
}

export function getAllBlogSlugs(): string[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const filenames = fs.readdirSync(blogDirectory);
  return filenames
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""));
}
