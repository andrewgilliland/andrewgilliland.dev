import {
  PaintBrushIcon,
  Square2StackIcon,
  Cog6ToothIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";

const AppWindow = () => {
  const [windowsOpen, setWindowsOpen] = useState({
    paint: false,
    app: false,
    settings: false,
  });

  return (
    <div className="relative h-32 w-48">
      <div className="absolute bg-black h-32 w-48 border-2 border-black rounded transform translate-x-1 translate-y-1" />
      <div className="absolute bg-pink-300 h-32 w-48 border-2 border-black rounded">
        <div className="flex justify-end bg-black border-b-2 border-black p-1">
          <div className="flex gap-1">
            {[
              { color: "cyan", Icon: PaintBrushIcon, window: "paint" },
              { color: "yellow", Icon: Square2StackIcon, window: "app" },
              { color: "pink", Icon: Cog6ToothIcon, window: "settings" },
            ].map(({ color, Icon, window }, index) => (
              <div
                onClick={() => {
                  setWindowsOpen({
                    ...windowsOpen,
                    [window]: !windowsOpen[window],
                  });
                }}
                key={index}
                className="h-3 w-3 rounded-full cursor-pointer"
              >
                <Icon className={`text-${color}-400`} />
              </div>
            ))}
          </div>
        </div>
        <div className="relative p-4">
          <div
            className={`absolute 
            border-2
            border-black 
            bg-cyan-300
            rounded 
            w-24 
            h-16
            transition-transform
            transform
            origin-top
            scale-${windowsOpen["paint"] ? "100" : "0"}
            `}
          />
          <div
            className={`absolute
            left-10
            top-6
            border-2
            border-black 
            bg-yellow-300 
            rounded 
            w-24 
            h-16
            transition-transform
            transform
            scale-${windowsOpen["app"] ? "100" : "0"}
            `}
          />
          <div
            className={`absolute
            left-20
            top-8
            border-2
            border-black 
            bg-emerald-300 
            rounded 
            w-24 
            h-16
            transition-transform
            transform
            origin-bottom
            scale-${windowsOpen["settings"] ? "100" : "0"}
            `}
          />
        </div>
      </div>
      {/* <div className="h-16 w-full scale-0 scale-100"></div> */}
    </div>
  );
};

export default AppWindow;
