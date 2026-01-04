import {
  XMarkIcon,
  MinusSmallIcon,
  ChevronUpDownIcon,
  UserIcon,
  BeakerIcon,
  BoltIcon,
  FireIcon,
} from "@heroicons/react/20/solid";
import BrowserWindowCard from "@/components/BrowserWindowCard";
import { FC } from "react";

type BrowserWindowProps = {
  className?: string;
};

const BrowserWindow: FC<BrowserWindowProps> = ({ className }) => {
  return (
    <div className={`relative h-32 w-48 ${className}`}>
      <div className="absolute bg-black h-32 w-48 border-2 border-black rounded transform translate-x-1 translate-y-1" />
      <div className="absolute bg-white h-32 w-48 border-2 border-black rounded">
        <div className="border-b-2 border-black p-1">
          <div className="group flex">
            {[
              { color: "red", Icon: XMarkIcon },
              { color: "yellow", Icon: MinusSmallIcon },
              { color: "emerald", Icon: ChevronUpDownIcon },
            ].map(({ color, Icon }, index) => (
              <div
                key={index}
                className={`bg-${color}-500 h-2 w-2 rounded-full ${
                  index && "ml-0.5"
                }`}
              >
                <Icon
                  className={`text-${color}-900 opacity-0 transition group-hover:opacity-100`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className=" px-5 py-2">
          <div className="flex justify-between items-center">
            <h4 className="text-black">Interwebs</h4>
            <div className="flex justify-center items-center bg-cyan-400 h-4 w-4 border border-black rounded-full transform-gpu transition hover:rotate-[360deg]">
              <UserIcon className="text-cyan-100 h-3 w-3" />
            </div>
          </div>
          <div className="flex mt-2 space-x-2">
            {[
              { color: "red", Icon: FireIcon },
              { color: "emerald", Icon: BeakerIcon },
              { color: "yellow", Icon: BoltIcon },
            ].map(({ color, Icon }, index) => (
              <BrowserWindowCard key={index} color={color} Icon={Icon} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserWindow;
