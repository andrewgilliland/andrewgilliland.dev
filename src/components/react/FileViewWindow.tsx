"use client";

import { type FC, useState } from "react";
import FileTree from "./FileTree";
import { FolderIcon } from "@heroicons/react/24/outline";

import FileRow from "./FileRow";
import {
  type DirectoryNode,
  type FileNode,
  isDirectoryNode,
  isFileNode,
} from "@/types";

type CollectionNote = {
  id: string;
  data: { title: string };
};

type FileViewWindowProps = {
  notes: CollectionNote[];
  basePath?: string;
};

const getOrCreateDir = (parent: DirectoryNode, name: string): DirectoryNode => {
  let dir = parent.children?.find(
    (c) => isDirectoryNode(c) && c.name === name,
  ) as DirectoryNode | undefined;

  if (!dir) {
    dir = { name, children: [] };
    parent.children!.push(dir);
  }
  return dir;
};

const buildDirectoryTree = (
  notes: CollectionNote[],
  basePath?: string,
): DirectoryNode => {
  const rootName = basePath?.split("/").pop() ?? "notes";
  const root: DirectoryNode = { name: rootName, children: [] };
  const prefix = basePath ? basePath + "/" : "";

  for (const note of notes) {
    const relativeId = prefix ? note.id.slice(prefix.length) : note.id;
    const parts = relativeId.split("/");
    const dirs = parts.slice(0, -1);
    const fileName = parts.at(-1)!;

    const parent = dirs.reduce(
      (node, name) => getOrCreateDir(node, name),
      root,
    );

    parent.children!.push({
      name: fileName,
      title: note.data.title,
      path: "/" + note.id,
    });
  }

  return root;
};

/** Recursive function to get all files that match the search term that compares by file path*/
const getFilesBySearchTerm = (
  searchTerm: string,
  node: DirectoryNode,
): FileNode[] => {
  const files: FileNode[] = [];

  if (node.children) {
    node.children.forEach((child) => {
      if (
        isFileNode(child) &&
        // Check if the file path includes the search term
        child.path.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        files.push(child);
      }

      if (isDirectoryNode(child)) {
        files.push(...getFilesBySearchTerm(searchTerm, child));
      }
    });
  }

  return files;
};

const FileViewWindow: FC<FileViewWindowProps> = ({ notes, basePath }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const directory = buildDirectoryTree(notes, basePath);
  const searchResults = getFilesBySearchTerm(searchTerm, directory);
  const mainDirectory = directory.name;

  return (
    <div className="relative overflow-hidden border-2 border-white">
      <div className="flex w-full flex-col justify-between gap-2 border-2 border-black bg-cyan-300 px-4 py-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold capitalize text-black">
            {mainDirectory}
          </h3>
        </div>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          type="text"
          placeholder={`Search ${mainDirectory === "notes" ? "all" : mainDirectory} notes`}
          className="border-2 border-black bg-white px-2 py-1 font-semibold text-black md:w-1/2"
        />
      </div>
      {/* Custom Scrollbar with Tailwindcss - https://preline.co/docs/custom-scrollbar.html */}
      <div className="h-[26rem] overflow-y-auto border-b-2 border-r-2 border-black [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:bg-emerald-300 dark:[&::-webkit-scrollbar-thumb]:bg-pink-300 [&::-webkit-scrollbar-track]:rounded-none [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar]:w-2">
        {searchTerm !== "" ? (
          // Success state
          <>
            {searchResults.length > 0 ? (
              <>
                {searchResults.map((result, index) => (
                  <FileRow key={index} fileNode={result} />
                ))}
              </>
            ) : (
              // Empty state
              <div className="p-4 text-center text-gray-300">
                No notes found with the search term &quot;{searchTerm}&quot;
              </div>
            )}
          </>
        ) : (
          // Default state
          <FileTree mainDirectory={mainDirectory} node={directory} />
        )}
      </div>
    </div>
  );
};

export default FileViewWindow;
