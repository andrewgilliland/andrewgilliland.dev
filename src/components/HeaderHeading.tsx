import Link from "next/link";
import colors from "tailwindcss/colors";

const HeaderHeading = () => {
  const pink300 = colors.pink["300"];
  const emerald300 = colors.emerald["300"];
  const cyan300 = colors.cyan["300"];
  const yellow300 = colors.yellow["300"];

  return (
    <Link href="/">
      <h2
        className="header-heading text-2xl font-bold md:text-3xl"
        style={{
          backgroundImage: `linear-gradient( to bottom right, ${pink300}, ${pink300} 30%, ${emerald300} 30%, ${emerald300} 50%, ${yellow300} 50%, ${yellow300} 70%, ${cyan300} 70%, ${cyan300})`,
        }}
      >
        Andrew Gilliland
      </h2>
    </Link>
  );
};

export default HeaderHeading;
