import { getBlogPosts } from "@/lib/utils/blog";
import Container from "@/components/Container";
import BlogCard from "@/components/BlogCard";

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <Container>
      <div className="mx-auto max-w-4xl py-8">
        <h1 className="mb-8 text-4xl font-bold">Blog</h1>

        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <h2 className="mb-4 text-2xl font-semibold">No blog posts yet</h2>
            <p className="text-gray-600">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
