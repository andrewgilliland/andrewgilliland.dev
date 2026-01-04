import { FC, ReactNode } from "react";

type CardGridProps = {
  children: ReactNode;
};

const CardGrid: FC<CardGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-6">
      {children}
    </div>
  );
};

export default CardGrid;
