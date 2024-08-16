import { FC } from "react";
import NoteRoute from "@/components/pages/notes/NoteRoute";

type NotesSlugFourPageProps = {
  params: {
    slugOne: string;
    slugTwo: string;
    slugThree: string;
    slugFour: string;
  };
};

const NotesSlugFourPage: FC<NotesSlugFourPageProps> = async ({
  params: { slugOne, slugTwo, slugThree, slugFour },
}) => {
  const pagePath = `./content/notes/${slugOne}/${slugTwo}/${slugThree}/${slugFour}`;

  return <NoteRoute directory={slugFour} pagePath={pagePath} />;
};

export default NotesSlugFourPage;
