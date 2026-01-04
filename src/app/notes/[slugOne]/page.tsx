import { FC } from "react";
import NoteRoute from "@/components/pages/notes/NoteRoute";
import { parentPath } from "@/lib/constants";

type NotesRouteOnePageProps = {
  params: {
    slugOne: string;
  };
};

const NotesRouteOnePage: FC<NotesRouteOnePageProps> = async ({
  params: { slugOne },
}) => {
  const pagePath = `${parentPath}/${slugOne}`;

  return <NoteRoute directory={slugOne} pagePath={pagePath} />;
};

export default NotesRouteOnePage;
