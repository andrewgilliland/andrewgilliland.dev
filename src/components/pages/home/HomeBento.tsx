import Block from "@/components/Block";
import BrowserWindow from "@/components/BrowserWindow";
import Phone from "@/components/Phone";
import SvgIcon from "@/components/svg/SvgIcon";

//! Make component mobile responsive

const HomeBento = () => {
  return (
    <div className="flex-1 bg-emerald-300 p-16 flex justify-center items-center">
      <div className="grid place-items-center md:grid-cols-2 gap-12 md:gap-5">
        <div className="grid grid-cols-2 gap-5 order-1">
          <Block backgroundColor="bg-yellow-300">
            <SvgIcon name="javascript" className="fill-black" />
          </Block>
          <Block backgroundColor="bg-blue-200">
            <SvgIcon name="css" className="fill-blue-600" />
          </Block>
        </div>
        <BrowserWindow className="order-3 md:order-2" />

        <Phone className="order-4 md:order-3" />
        <div className="grid grid-cols-2 md:grid-cols-1 gap-5 order-2 md:order-4">
          <Block backgroundColor="bg-emerald-100">
            <SvgIcon name="node" className="fill-emerald-600" />
          </Block>
          <Block backgroundColor="bg-gray-600">
            <SvgIcon
              name="react"
              className="fill-sky-400 rotate-0 transition hover:rotate-180 duration-500 ease-in-out"
            />
          </Block>
        </div>
      </div>
    </div>
  );
};

export default HomeBento;
