import Link from "next/link";
import { BlogPostFrontmatter } from "@/types";

interface BlogCardProps {
  frontmatter: BlogPostFrontmatter;
  slug: string;
}

export default function BlogCard({ frontmatter, slug }: BlogCardProps) {
  const { title, description } = frontmatter;

  return (
    <Link
      className="group relative min-w-[240px]"
      href={`/blog/${slug}`}
      title={frontmatter.title}
    >
      <>
        <div className="absolute bottom-0 h-full w-full rounded border-2 border-white bg-black" />
        <div className="transform-gpu rounded border-2 border-white bg-black p-4 transition group-hover:-translate-x-1 group-hover:-translate-y-1">
          <h4 className="font-bold text-white">{title}</h4>
          <p className="mt-2 text-gray-300">{description}</p>
        </div>
      </>
    </Link>
  );
}
