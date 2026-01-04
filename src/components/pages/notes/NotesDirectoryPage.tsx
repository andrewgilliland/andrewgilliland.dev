import { FC } from "react";
import { getNotesFileTree } from "@/lib/actions/notes";
import FileViewWindow from "@/components/FileViewWindow";

type NotesDirectoryPageProps = {
  directory: string;
  pagePath: string;
};

const NotesDirectoryPage: FC<NotesDirectoryPageProps> = async ({
  directory,
  pagePath,
}) => {
  const direct = await getNotesFileTree(pagePath);

  return (
    <div className="px-8">
      {directory === "" && (
        <section className="mx-auto mt-20 max-w-[60ch]">
          <h2 className="stroke-white text-3xl font-bold capitalize text-gray-100 md:text-4xl">
            Notes
          </h2>
          <p className="mt-10 text-gray-300">
            A collection of notes on various topics. My notes may be code
            snippets, info that comes directly from docs, or what I have
            learned. I will add resources to give due credit where info comes
            from. Click on a topic below to view notes related to that topic.
          </p>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-[60ch]">
        <FileViewWindow directory={direct} />
      </section>
    </div>
  );
};

export default NotesDirectoryPage;
