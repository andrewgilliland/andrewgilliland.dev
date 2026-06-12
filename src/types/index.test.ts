import { describe, it, expect } from "vitest";
import { isFileNode, isDirectoryNode } from "../types";
import type { FileNode, DirectoryNode } from "../types";

const file: FileNode = {
  name: "index.ts",
  title: "Index",
  path: "/src/index.ts",
};
const dir: DirectoryNode = { name: "components", children: [] };

describe("isFileNode", () => {
  it("returns true for a FileNode", () => {
    expect(isFileNode(file)).toBe(true);
  });

  it("returns false for a DirectoryNode", () => {
    expect(isFileNode(dir)).toBe(false);
  });
});

describe("isDirectoryNode", () => {
  it("returns true for a DirectoryNode", () => {
    expect(isDirectoryNode(dir)).toBe(true);
  });

  it("returns false for a FileNode", () => {
    expect(isDirectoryNode(file)).toBe(false);
  });

  it("returns true for a DirectoryNode with nested children", () => {
    const nested: DirectoryNode = {
      name: "src",
      children: [{ name: "lib", children: [file] }],
    };
    expect(isDirectoryNode(nested)).toBe(true);
  });
});
