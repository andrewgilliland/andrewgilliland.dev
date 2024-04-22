import { cyan300, emerald300, pink300, yellow300 } from "@/styles/colors";
import { FC } from "react";

type ColorDividerProps = {
  className?: string;
};

const ColorDivider: FC<ColorDividerProps> = ({
  className = "w-full h-2 rounded-full mt-8",
}) => (
  <div
    className={className}
    style={{
      backgroundImage: `linear-gradient( -10deg, ${pink300}, ${pink300} 30%, ${emerald300} 30%, ${emerald300} 50%, ${yellow300} 50%, ${yellow300} 70%, ${cyan300} 70%, ${cyan300})`,
    }}
  />
);

export default ColorDivider;
