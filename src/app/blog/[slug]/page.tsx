import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllBlogSlugs } from "@/lib/utils/blog";
import Container from "@/components/Container";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <Container>
      <div className="mx-auto max-w-4xl py-8">
        <nav className="mb-8">
          <Link
            href="/blog"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Blog
          </Link>
        </nav>

        <article className="prose prose-lg max-w-none">
          <header className="mb-8">
            <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>

            {post.date && (
              <p className="mb-4 text-gray-500">
                Published on{" "}
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.html || "" }}
          />
        </article>

        <nav className="mt-12 border-t border-gray-200 pt-8">
          <Link
            href="/blog"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Blog
          </Link>
        </nav>
      </div>
    </Container>
  );
}
