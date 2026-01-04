import { FC, ReactNode } from "react";
import PageHeading from "../typography/PageHeading";

type PageLayoutProps = {
  title: string;
  children: ReactNode;
};

const PageLayout: FC<PageLayoutProps> = ({ title, children }) => {
  return (
    <div className="mx-auto mt-14 min-h-screen w-full max-w-3xl">
      <PageHeading className="ml-8 mt-10">{title}</PageHeading>
      {children}
    </div>
  );
};

export default PageLayout;
