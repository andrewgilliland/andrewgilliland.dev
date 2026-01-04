import { Children, FC, isValidElement, ReactNode } from "react";

type TwinSectionsProps = {
  children: ReactNode;
};

type TwinSectionProps = {
  children: ReactNode;
};

const SectionOne: FC<TwinSectionProps> = ({ children }) => (
  <div className="flex flex-1 flex-col items-center justify-center border-b-2 border-white bg-pink-300 px-[6.5vw] py-16 md:border-b-0 md:border-r-2">
    {children}
  </div>
);

const SectionTwo: FC<TwinSectionProps> = ({ children }) => (
  <div className="flex flex-1 flex-col items-center justify-center bg-cyan-300 px-[6.5vw] py-16">
    {children}
  </div>
);

// ! Todo: add color props

const TwinSections: FC<TwinSectionsProps> & {
  SectionOne: FC<TwinSectionProps>;
  SectionTwo: FC<TwinSectionProps>;
} = ({ children }) => {
  return (
    <section className="flex flex-col border-b-2 border-white md:flex-row">
      {Children.map(children, (child) => {
        if (
          isValidElement(child) &&
          (child.type === SectionOne || child.type === SectionTwo)
        ) {
          return child;
        }
        return null;
      })}
    </section>
  );
};

TwinSections.SectionOne = SectionOne;
TwinSections.SectionTwo = SectionTwo;

export default TwinSections;
