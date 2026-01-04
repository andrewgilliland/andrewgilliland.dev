import { FC } from "react";
import NoteRoute from "@/components/pages/notes/NoteRoute";
import { parentPath } from "@/lib/constants";

type NotesSlugFourPageProps = {
  params: {
    slugOne: string;
    slugTwo: string;
    slugThree: string;
    slugFour: string;
    slugFive: string;
  };
};

const NotesSlugFourPage: FC<NotesSlugFourPageProps> = async ({
  params: { slugOne, slugTwo, slugThree, slugFour, slugFive },
}) => {
  const pagePath = `${parentPath}/${slugOne}/${slugTwo}/${slugThree}/${slugFour}/${slugFive}`;

  return <NoteRoute directory={slugFive} pagePath={pagePath} />;
};

export default NotesSlugFourPage;
