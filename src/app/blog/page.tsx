import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BlogPost, BlogPostFrontmatter } from "@/types";
import BlogCard from "@/components/BlogCard";

export default async function BlogPage() {
  const blogDir = path.join(process.cwd(), "content/blog");
  const files: string[] = fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith(".md"));

  const posts = files.map((file: string): BlogPost => {
    const filePath = path.join(blogDir, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);
    const frontmatter: BlogPostFrontmatter = data as BlogPostFrontmatter;
    return { frontmatter, content, slug: file.replace(/\.md$/, "") };
  });

  return (
    <div className="px-8">
      <section className="mx-auto mt-20 max-w-[60ch]">
        <h1 className="stroke-white text-3xl font-bold capitalize text-gray-100 md:text-4xl">
          Blog
        </h1>
        <p className="mt-10 text-gray-300">
          Welcome to my blog! Here you&apos;ll find articles, tutorials, and
          insights on web development, design, and technology.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-[60ch]">
        <div className="grid gap-6">
          {posts?.map(({ frontmatter, slug }) => (
            <BlogCard
              key={frontmatter.title}
              frontmatter={frontmatter}
              slug={slug}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
