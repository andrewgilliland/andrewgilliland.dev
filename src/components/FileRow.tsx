import { FC } from "react";
import { FileNode } from "@/types";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type FileRowProps = {
  fileNode: FileNode;
  /** depth of the node in the tree determines left padding */
  depth?: number;
};

const FileRow: FC<FileRowProps> = ({ fileNode, depth = 1 }) => {
  return (
    <Link
      href={`/notes${fileNode.path}`}
      title={fileNode.title}
      className="flex border-b border-gray-800 py-3 pr-4 transition-colors hover:bg-gray-900"
      style={{ paddingLeft: 16 * depth }}
    >
      <div className="flex w-full items-center gap-2">
        <div>
          <PencilSquareIcon className="h-5 w-5 stroke-2 text-pink-300" />
        </div>
        <span className="truncate text-base font-bold text-white">
          {fileNode.title}
        </span>
      </div>
    </Link>
  );
};

export default FileRow;
