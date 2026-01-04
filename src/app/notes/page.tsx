import NotesDirectoryPage from "@/components/pages/notes/NotesDirectoryPage";
import { parentPath } from "@/lib/constants";

const NotesPage = () => {
  const pagePath = parentPath;

  return <NotesDirectoryPage directory="" pagePath={pagePath} />;
};

export default NotesPage;
