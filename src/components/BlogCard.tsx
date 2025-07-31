import { BlogPost } from "@/types";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="mb-2 text-xl font-semibold">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors hover:text-blue-600"
          >
            {post.title}
          </Link>
        </h2>

        {post.date && (
          <p className="mb-3 text-sm text-gray-500">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {post.excerpt && (
          <p className="mb-4 line-clamp-3 text-gray-700">{post.excerpt}</p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link
        href={`/blog/${post.slug}`}
        className="inline-block font-medium text-cyan-300 transition-colors hover:text-cyan-500"
      >
        Read more →
      </Link>
    </article>
  );
}
