import type { FC } from "react";
import {
  currentDayOfWeek,
  currentMonthName,
  currentDay,
  currentTime,
  currentMinutes,
} from "@/lib/utils/date";

type PhoneProps = {
  className?: string;
};

const Phone: FC<PhoneProps> = ({ className }) => {
  return (
    <div className={className}>
      {/* Shadow */}
      <div className="absolute h-[198px] w-[96px] translate-x-0.5 translate-y-0.5 rounded-[12px] bg-black" />

      <div className="relative z-10 h-[198px] w-[96px] rounded-[12px] border-2 border-black bg-gray-700 opacity-100 transition-all">
        <div className="absolute left-[36%] top-1 z-30 h-2 w-7 rounded-full bg-black">
          <div className="absolute left-[75%] top-[33%] h-0.5 w-0.5 rounded-full bg-white" />
        </div>

        <div className="absolute z-20 h-full w-full rounded-[10px] bg-gray-800 opacity-100 transition duration-500 hover:opacity-0" />

        <div className="absolute left-[22%] top-[14%] flex flex-col items-center font-sans text-white">
          <div className="text-[6px]">{`${currentDayOfWeek}, ${currentMonthName} ${
            currentDay - 1
          }`}</div>
          <div className="mt-0.5 text-2xl leading-[20px]">{`${currentTime}:${currentMinutes}`}</div>
        </div>

        <div className="absolute bottom-[10%] left-[6px] grid gap-1">
          <div className="h-8 w-20 rounded-md border border-gray-600 bg-gray-800" />
          <div className="h-8 w-20 rounded-md border border-gray-600 bg-gray-800" />
          <div className="h-8 w-20 rounded-md border border-gray-600 bg-gray-800" />
        </div>

        {/* Side Buttons */}
        <div className="absolute left-[-4%] top-[18.5%] h-[4%] w-[2%] bg-black" />
        <div className="absolute left-[-4%] top-[26%] h-[7.5%] w-[2%] bg-black" />
        <div className="absolute left-[-4%] top-[36%] h-[7.5%] w-[2%] bg-black" />
      </div>
    </div>
  );
};

export default Phone;
