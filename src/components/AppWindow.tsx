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
      <div className="absolute h-32 w-48 translate-x-1 translate-y-1 transform rounded border-2 border-black bg-black" />
      <div className="absolute h-32 w-48 rounded border-2 border-black bg-pink-300">
        <div className="flex justify-end border-b-2 border-black bg-black p-1">
          <div className="flex gap-1">
            {[
              { color: "cyan", Icon: PaintBrushIcon, window: "paint" as const },
              {
                color: "yellow",
                Icon: Square2StackIcon,
                window: "app" as const,
              },
              {
                color: "pink",
                Icon: Cog6ToothIcon,
                window: "settings" as const,
              },
            ].map(({ color, Icon, window }, index) => (
              <div
                onClick={() => {
                  setWindowsOpen({
                    ...windowsOpen,
                    [window]: !windowsOpen[window],
                  });
                }}
                key={index}
                className="h-3 w-3 cursor-pointer rounded-full"
              >
                <Icon className={`text-${color}-400`} />
              </div>
            ))}
          </div>
        </div>
        <div className="relative p-4">
          <div
            className={`absolute h-16 w-24 origin-top transform rounded border-2 border-black bg-cyan-300 transition-transform scale-${windowsOpen["paint"] ? "100" : "0"} `}
          />
          <div
            className={`absolute left-10 top-6 h-16 w-24 transform rounded border-2 border-black bg-yellow-300 transition-transform scale-${windowsOpen["app"] ? "100" : "0"} `}
          />
          <div
            className={`absolute left-20 top-8 h-16 w-24 origin-bottom transform rounded border-2 border-black bg-emerald-300 transition-transform scale-${windowsOpen["settings"] ? "100" : "0"} `}
          />
        </div>
      </div>
      {/* <div className="h-16 w-full scale-0 scale-100"></div> */}
    </div>
  );
};

export default AppWindow;
