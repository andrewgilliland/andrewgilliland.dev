---
title: "Building a Next.js Blog with Markdown"
date: "2025-01-20"
excerpt: "Learn how to create a blog system in Next.js that reads markdown files and renders them beautifully."
tags: ["nextjs", "markdown", "tutorial", "web-development"]
---

# Building a Next.js Blog with Markdown

Creating a blog with Next.js and markdown files is a powerful combination that gives you the flexibility of static content with the power of React components.

## Why Markdown for Blogging?

Markdown offers several advantages for blogging:

- **Simple syntax** that's easy to write and read
- **Version control friendly** - you can track changes with Git
- **Fast loading** - no database queries needed
- **Portable** - markdown files can be used anywhere

## The Implementation

Here's how I built this blog system:

### 1. File Structure

```
content/
  blog/
    hello-world.md
    building-nextjs-blog.md
```

### 2. Parsing Markdown

Using `gray-matter` to parse frontmatter and `marked` to convert markdown to HTML.

### 3. Dynamic Routes

Next.js App Router makes it easy to create dynamic routes for individual blog posts.

## Code Example

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export function getBlogPosts() {
  const blogDirectory = path.join(process.cwd(), "content/blog");
  const filenames = fs.readdirSync(blogDirectory);

  return filenames.map((name) => {
    const filePath = path.join(blogDirectory, name);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug: name.replace(/\.md$/, ""),
      ...data,
      content,
    };
  });
}
```

This is a great foundation for any blog system!

## What's Next?

In future posts, I'll cover:

- Adding search functionality
- Implementing tags and categories
- SEO optimization
- Adding comments

Stay tuned for more!
