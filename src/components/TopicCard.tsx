import { FC } from "react";
import { FolderIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Topic } from "@/types";

type TopicCardProps = {
  topic: Topic;
};

const TopicCard: FC<TopicCardProps> = ({ topic }) => {
  const { name, path, color } = topic;
  const lineColor = color ? "black" : "white";
  const bgColor = color ? "white" : "black";

  return (
    <Link
      data-cy={`topic-card-${name.toLocaleLowerCase()}`}
      href={`/${path.toLocaleLowerCase()}`}
      className="group relative"
    >
      <div
        className={`absolute bg-${bgColor} border-2 border-${lineColor} rounded w-full h-full bottom-0`}
      />
      <div
        className={`flex justify-between bg-${
          color ? `${color}-400` : "black"
        } border-2 border-${lineColor} rounded p-4 transform-gpu transition group-hover:-translate-x-1 group-hover:-translate-y-1`}
      >
        <div className={`capitalize font-bold text-${lineColor}`}>{name}</div>
        <FolderIcon className={`h-6 w-6 stroke-${lineColor} fill-${bgColor}`} />
      </div>
    </Link>
  );
};

export default TopicCard;
