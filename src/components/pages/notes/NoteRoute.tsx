import { FC } from "react";
import { RoutePageProps } from "@/types";
import NotePage from "./NotePage";
import NotesDirectoryPage from "./NotesDirectoryPage";
import { isPathDirectory } from "@/lib/utils/fs";

// ! Todo: Add Prop Types
const NoteRoute = async ({ directory, pagePath }) => {
  const isDirectory = await isPathDirectory(pagePath);

  return (
    <>
      {isDirectory ? (
        <NotesDirectoryPage directory={directory} pagePath={pagePath} />
      ) : (
        <NotePage pagePath={pagePath} />
      )}
    </>
  );
};

export default NoteRoute;
