import Block from "./Block";
import SvgIcon from "./svg/SvgIcon";

const AnimatedBlocks = () => (
  <div className="relative grid grid-rows-2 grid-flow-col gap-6 animate-rotate">
    <div className="absolute h-28 w-28 border-2 border-black rounded-full left-0 right-0 top-0 bottom-0 ml-auto mr-auto mt-auto mb-auto" />
    {[
      {
        color: "yellow",
        icon: (
          <SvgIcon name="javascript" className="fill-yellow-300 h-10 w-10" />
        ),
      },
      {
        color: "cyan",
        icon: <SvgIcon name="react" className="fill-cyan-300 h-10 w-10" />,
      },
      {
        color: "pink",
        icon: <SvgIcon name="swift" className="fill-pink-300 h-10 w-10" />,
      },
      {
        color: "emerald",
        icon: <SvgIcon name="css" className="fill-emerald-300 h-10 w-10" />,
      },
    ].map(({ color }, index) => (
      <Block key={index} />
    ))}
  </div>
);

export default AnimatedBlocks;
