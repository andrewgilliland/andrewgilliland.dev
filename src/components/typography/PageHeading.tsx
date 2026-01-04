import { FC } from "react";

type PageHeadingProps = {
  className?: string;
  children: React.ReactNode;
};

const PageHeading: FC<PageHeadingProps> = ({ className, children }) => (
  <h1
    className={`stroke-white text-3xl font-bold capitalize text-gray-100 md:text-4xl ${className}`}
  >
    {children}
  </h1>
);

export default PageHeading;
