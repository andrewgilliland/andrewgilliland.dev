export type NoteFrontmatter = {
  title: string;
  date: Date;
  excerpt: string;
  draft: boolean;
};

export type Note = {
  path: string;
  frontmatter: NoteFrontmatter;
  content: string;
};

export type Topic = { name: string; path: string; color?: string };

export type HeadingElement = {
  id: string;
  text: string;
  tag: string;
};

export type Page = { href: string; title: string };

export type RoutePageProps = {
  note?: Note;
  topic?: string;
  notes?: Note[];
  topics?: Topic[];
};

export type FileNode = {
  name: string;
  title: string;
  path: string;
};

export type DirectoryNode = {
  name: string;
  children?: (DirectoryNode | FileNode)[];
};

export type Project = {
  title: string;
  description: string;
  href: string;
  logo?: string;
  overview?: string;
  features?: string[];
  techStack?: string[];
  images?: string[];
};

export type BlogPostFrontmatter = {
  title: string;
  date: string;
  description?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
};

export type BlogPost = {
  frontmatter: BlogPostFrontmatter;
  content: string;
  slug: string;
};

// Type guard to check if a node is of type FileNode
export const isFileNode = (node: DirectoryNode | FileNode): node is FileNode =>
  "path" in node;

// Type guard to check if a node is of type DirectoryNode
export const isDirectoryNode = (
  node: DirectoryNode | FileNode,
): node is DirectoryNode => "children" in node;
