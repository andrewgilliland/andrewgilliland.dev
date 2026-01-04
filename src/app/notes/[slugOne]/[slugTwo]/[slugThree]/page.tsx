import { FC } from "react";
import NoteRoute from "@/components/pages/notes/NoteRoute";
import { parentPath } from "@/lib/constants";

type NotesRouteThreePageProps = {
  params: {
    slugOne: string;
    slugTwo: string;
    slugThree: string;
  };
};

const NotesRouteThreePage: FC<NotesRouteThreePageProps> = async ({
  params: { slugOne, slugTwo, slugThree },
}) => {
  const pagePath = `${parentPath}/${slugOne}/${slugTwo}/${slugThree}`;

  return <NoteRoute directory={slugThree} pagePath={pagePath} />;
};

export default NotesRouteThreePage;
