import { FC, ReactNode } from "react";

type CenteredSectionProps = {
  children: ReactNode;
};

const CenteredSection: FC<CenteredSectionProps> = ({ children }) => {
  return (
    <section className="bg-black px-[6.5vw] py-16 md:p-20">{children}</section>
  );
};

export default CenteredSection;
