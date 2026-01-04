"use server";
import fs from "fs";
import path from "path";

/** Checks if a url path is a directory or file */
export const isPathDirectory = async (path: string): Promise<boolean> => {
  try {
    const decodedPath = decodeURIComponent(path);
    const stats = await fs.promises.stat(decodedPath);
    return stats.isDirectory();
  } catch (error) {
    // ! Todo: shouldn't return false, should throw an error
    return false;
  }
};

/** Recursively finds all file paths in a directory tree */
export const getFilesPaths = async (
  rootDirectory: string
): Promise<string[]> => {
  let entries = fs.readdirSync(rootDirectory, { withFileTypes: true });

  let files = entries
    .filter((entry) => !entry.isDirectory())
    .map((entry) => path.join(rootDirectory, entry.name)); // maps to an array of file paths

  let directories = entries.filter((entry) => entry.isDirectory());

  for (let directory of directories) {
    let subdirPaths = await getFilesPaths(
      path.join(`${rootDirectory}`, directory.name)
    );

    files = files.concat(subdirPaths); // adds the file paths from the subdirectories
  }

  return files;
};
