import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface BlogPostFrontmatter {
  title: string;
  date: string;
  description?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
}

interface BlogPost {
  frontmatter: BlogPostFrontmatter;
  content: string;
  slug: string;
}

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
          Welcome to my blog! Here you'll find articles, tutorials, and insights
          on web development, design, and technology.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-[60ch]">
        <div className="grid gap-6">
          {posts?.map(({ frontmatter, slug }) => (
            <Link
              key={frontmatter.title}
              className="group relative min-w-[240px]"
              href={`/blog/${slug}`}
              title={frontmatter.title}
            >
              <>
                <div className="absolute bottom-0 h-full w-full rounded border-2 border-white bg-black" />
                <div className="transform-gpu rounded border-2 border-white bg-black p-4 transition group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <h4 className="font-bold text-white">{frontmatter.title}</h4>
                  <p className="mt-2 text-gray-300">
                    {frontmatter.description}
                  </p>
                </div>
              </>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
