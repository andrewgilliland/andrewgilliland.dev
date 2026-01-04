import { ReactNode } from "react";

type BlockProps = {
  className?: string;
  children?: ReactNode;
  backgroundColor?: string;
  size?: string;
  height?: string;
  width?: string;
  theme?: "dark" | "light";
};

const Block = ({
  className,
  children,
  backgroundColor,
  size = "16",
  height = "16",
  width = "16",
  theme = "light",
}: BlockProps) => {
  const themeOptions = { dark: "white", light: "black" };

  return (
    <div className={`group relative ${className}`}>
      <div
        className={`absolute top-0 bg-${themeOptions[theme]} h-${height} w-${width} translate-x-1 translate-y-1 rounded-lg`}
      />
      <div
        className={`relative flex items-center justify-center text-white h-${height} w-${width} border-2 border-${themeOptions[theme]} rounded-lg transition-transform group-hover:translate-x-1 group-hover:translate-y-1 ${backgroundColor}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Block;
