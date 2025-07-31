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

// Type guard to check if a node is of type FileNode
export const isFileNode = (node: DirectoryNode | FileNode): node is FileNode =>
  "path" in node;

// Type guard to check if a node is of type DirectoryNode
export const isDirectoryNode = (
  node: DirectoryNode | FileNode,
): node is DirectoryNode => "children" in node;

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: string;
  html?: string;
}
