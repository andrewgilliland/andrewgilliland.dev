import { FC, MouseEvent, useState } from "react";
import { FolderPlusIcon, FolderMinusIcon } from "@heroicons/react/24/outline";
import FileRow from "./FileRow";
import { DirectoryNode, FileNode, isDirectoryNode } from "@/types";

type FileTreeProps = {
  mainDirectory: string;
  node: DirectoryNode | FileNode;
  /** depth of the node in the tree determines left padding */
  depth?: number;
};

const FileTree: FC<FileTreeProps> = ({ mainDirectory, node, depth = 0 }) => {
  const isMainDirectory = node.name === mainDirectory;
  const [isOpen, setIsOpen] = useState(isMainDirectory);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleClick = (
    event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
  ) => {
    // Switch on the mouse button clicked
    switch (event.detail) {
      case 1:
        toggleOpen();
        break;
      case 2:
        // TODO: Needs to get the path of depth more than 1
        // window.location.href = `/notes/${node.name}`;
        break;
    }
  };

  return (
    <div>
      {isMainDirectory && isDirectoryNode(node) && node.children ? (
        // Hide the main directory node
        // ! This is a hacky way to hide the main directory node
        <div className="hidden" />
      ) : (
        <div>
          {isDirectoryNode(node) ? (
            <button
              className="flex w-full items-center gap-2 border-b border-gray-800 py-3 pr-4 transition-colors hover:bg-gray-900"
              onClick={(event) => handleClick(event)}
              style={{ paddingLeft: 16 * depth }}
            >
              {isOpen ? (
                <FolderMinusIcon className="h-6 w-6 text-white" />
              ) : (
                <FolderPlusIcon className="h-6 w-6 text-white" />
              )}
              <span className="truncate text-base font-bold text-white">
                {node.name}
              </span>
            </button>
          ) : (
            <FileRow fileNode={node} depth={depth} />
          )}
        </div>
      )}

      {isDirectoryNode(node) && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTree
              mainDirectory={mainDirectory}
              key={index}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTree;
