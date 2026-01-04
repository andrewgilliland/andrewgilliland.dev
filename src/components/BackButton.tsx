import { FC } from "react";

type BackButtonProps = {
  back: () => void;
};

const BackButton: FC<BackButtonProps> = ({ back }) => (
  <button
    className="group flex w-fit items-center text-gray-400 transition-colors hover:text-gray-200"
    onClick={back}
  >
    <svg
      className="mr-1 rotate-180 transform fill-none stroke-current stroke-2"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <g fillRule="evenodd">
        <path
          className="opacity-0 transition group-hover:opacity-100"
          d="M0 5h7"
        ></path>
        <path
          className="transition group-hover:translate-x-[3px]"
          d="M1 1l4 4-4 4"
        ></path>
      </g>
    </svg>
    <div className="ml-1">Go Back</div>
  </button>
);

export default BackButton;
