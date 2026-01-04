import { FC } from "react";

type OpenCloseProps = {
  isOpen: boolean;
};

const OpenClose: FC<OpenCloseProps> = ({ isOpen }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={`fill-pink-300 h-10 w-10 transition ease-in-out ${
        isOpen ? "rotate-90" : "rotate-0"
      }`}
    >
      <path
        className={`fill-pink-300 ${isOpen ? "opacity-0" : "opacity-100"}`}
        fillRule="evenodd"
        d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Z"
      />
      <path
        className={`fill-pink-300 ${
          isOpen ? "-rotate-45" : "rotate-0"
        } origin-center`}
        fillRule="evenodd"
        d="M3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Z"
      />
      <path
        className={`fill-cyan-300 ${
          isOpen ? "rotate-45" : "rotate-0"
        } origin-center`}
        fillRule="evenodd"
        d="M3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Z"
      />
      <path
        className={`fill-yellow-300 ${isOpen ? "opacity-0" : "opacity-100"}`}
        fillRule="evenodd"
        d="M3 17.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
      />
    </svg>
  );
};

export default OpenClose;
