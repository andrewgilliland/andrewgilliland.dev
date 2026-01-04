"use server";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { marked } from "marked";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighterCore } from "shiki/core";

type TransformMarkdownFileResult = {
  frontmatter: Record<string, string>;
  html: string;
};

/* Separates frontmatter and content from markdownfile, then transforms content to html */
const transformMarkdownFile = async (
  fileName: string,
): Promise<TransformMarkdownFileResult> => {
  try {
    const markdownWithMeta = fs.readFileSync(
      path.join("content", fileName),
      "utf-8",
    );

    const { data: frontmatter, content } = matter(markdownWithMeta);
    const html = marked(content);

    return {
      frontmatter,
      html,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${fileName}`);
    } else {
      throw new Error(`Error reading file: ${fileName}`);
    }
  }
};

const transformMarkdown = async (
  pagePath: string,
): Promise<TransformMarkdownFileResult> => {
  const markdownFilePath = `${decodeURIComponent(pagePath)}.md`;

  const highlighter = await createHighlighterCore({
    themes: [import("shiki/themes/synthwave-84.mjs")],
    langs: [
      import("shiki/langs/html.mjs"),
      import("shiki/langs/css.mjs"),
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/jsx.mjs"),
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/swift.mjs"),
      import("shiki/langs/bash.mjs"),
    ],
    loadWasm: import("shiki/wasm"),
  });

  try {
    // ! path.join(process.cwd(), `${decodeURIComponent(pagePath)}.md`) is needed to access the correct file path
    const markdownWithMeta = fs.readFileSync(
      path.join(process.cwd(), markdownFilePath),
      "utf-8",
    );

    const { data: frontmatter, content } = matter(markdownWithMeta);

    // ! This is needed for code syntax highlighting
    // ! This allows for line highlighting but also requires a '.hightlighted' class to be in the index.css
    const file = await unified()
      .use(remarkParse) // Parse markdown
      .use(remarkRehype, { allowDangerousHtml: true }) // Turn markdown into HTML, and allow raw HTML
      .use(rehypeShikiFromHighlighter, highlighter, {
        theme: "synthwave-84",
      }) // Syntax highlighting
      .use(rehypeStringify, { allowDangerousHtml: true }) // Turn HTML into string
      .process(content);

    const html = file.value as string;

    return {
      frontmatter,
      html,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${markdownFilePath}`);
    } else {
      throw new Error(`Error reading file: ${markdownFilePath}`);
    }
  }
};

export { transformMarkdownFile, transformMarkdown };
