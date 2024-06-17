import { FC } from "react";
import NoteRoute from "@/components/pages/notes/NoteRoute";

type NotesRouteTwoPageProps = {
  params: {
    slugOne: string;
    slugTwo: string;
  };
};

const NotesRouteTwoPage: FC<NotesRouteTwoPageProps> = async ({
  params: { slugOne, slugTwo },
}) => {
  const pagePath = `./posts/${slugOne}/${slugTwo}`;

  return <NoteRoute directory={slugTwo} pagePath={pagePath} />;
};

export default NotesRouteTwoPage;
