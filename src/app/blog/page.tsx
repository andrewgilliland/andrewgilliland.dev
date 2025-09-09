import Link from "next/link";
import fs from "fs";
import path from "path";

export default async function BlogPage() {
  const blogDir = path.join(process.cwd(), "content/blog");
  const files: any = fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith(".md"));

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
          {files?.map(({ href, title, description }) => (
            <Link
              key={title}
              className="group relative min-w-[240px]"
              href={href}
              title={title}
            >
              <div className="absolute bottom-0 h-full w-full rounded border-2 border-white bg-black" />
              <div className="transform-gpu rounded border-2 border-white bg-black p-4 transition group-hover:-translate-x-1 group-hover:-translate-y-1">
                <h4 className="font-bold text-white">{title}</h4>
                <p className="mt-2 text-gray-300">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
