import Link from "next/link";
import { Note } from "@/types";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

type NoteCardProps = {
  note: Partial<Note>;
  index: number;
};

const NoteCard = ({ note }: NoteCardProps) => {
  const { path, frontmatter } = note;
  const lineColor = "white";
  const bgColor = "black";
  const formattedDate = new Date(frontmatter!.date).toLocaleDateString(
    "en-us",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    // <Link
    //   data-cy={`note-card-${path}`}
    //   href={`/notes/${path}`}
    //   className="group relative"
    // >
    //   <div className="absolute bg-black border-2 border-white rounded w-full h-full bottom-0" />
    //   <div
    //     className={`bg-black border-2 border-white rounded h-full transform-gpu transition group-hover:-translate-x-1 group-hover:-translate-y-1`}
    //   >
    //     <div className="flex flex-wrap border-b-2 border-white w-full h-48">
    //       {[
    //         { color: "pink" },
    //         { color: "cyan" },
    //         { color: "emerald" },
    //         { color: "yellow" },
    //       ].map(({ color }, index) => (
    //         <div
    //           key={index}
    //           className={`flex justify-center items-center bg-${color}-300 h-1/2 w-1/2`}
    //         >
    //           <FireIcon className={`text-${color}-200 h-12 w-12`} />
    //         </div>
    //       ))}
    //     </div>
    //     <div className="mt-6 px-4 pb-4">
    //       <div>
    //         <p className="text-gray-300 text-sm">{formattedDate}</p>
    //         <h3 className="font-semibold text-gray-100 text-lg">
    //           {frontmatter!.title}
    //         </h3>
    //         <p className="text-gray-300 text-sm">{frontmatter!.excerpt}</p>
    //       </div>
    //       <div className="text-gray-300 text-sm">Read More</div>
    //     </div>
    //   </div>
    // </Link>
    <Link
      data-cy={`topic-card-${frontmatter!.title}`}
      href={`/notes/${path!}`}
      className="group relative"
    >
      <div
        className={`absolute bg-${bgColor} border-2 border-${lineColor} rounded w-full h-full bottom-0`}
      />
      <div
        title={frontmatter!.title}
        className={`flex justify-between bg-black border-2 border-${lineColor} rounded p-4 transform-gpu transition group-hover:-translate-x-1 group-hover:-translate-y-1`}
      >
        <div
          className={`capitalize font-bold w-2/3 truncate text-${lineColor}`}
        >
          {frontmatter!.title}
        </div>
        <PencilSquareIcon
          className={`h-6 w-6 stroke-${lineColor} fill-${bgColor}`}
        />
      </div>
    </Link>
  );
};

export default NoteCard;
