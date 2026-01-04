import { FC } from "react";
import {
  currentDayOfWeek,
  currentMonthName,
  currentDay,
  currentTime,
  currentMinutes,
} from "../lib/utils/date";

type PhoneProps = {
  className?: string;
};

const Phone: FC<PhoneProps> = ({ className }) => {
  return (
    <div className={className}>
      {/* Shadow */}
      <div className="absolute bg-black w-[96px] h-[198px] rounded-[12px] translate-x-0.5 translate-y-0.5" />

      <div className="relative z-10 border-2 border-black bg-gray-700 w-[96px] h-[198px] rounded-[12px] opacity-100 transition-all">
        <div className="absolute z-30 left-[36%] top-1 bg-black w-7 h-2 rounded-full">
          <div className="absolute left-[75%] top-[33%] bg-white w-0.5 h-0.5 rounded-full" />
        </div>

        <div className="absolute z-20 bg-gray-800 w-full h-full rounded-[10px] opacity-100 hover:opacity-0 transition duration-500" />

        <div className="absolute left-[22%] top-[14%] flex flex-col items-center font-sans text-white">
          <div className="text-[6px]">{`${currentDayOfWeek}, ${currentMonthName} ${
            currentDay - 1
          }`}</div>
          <div className="text-2xl leading-[20px] mt-0.5">{`${currentTime}:${currentMinutes}`}</div>
        </div>

        <div className="absolute grid gap-1 left-[6px] bottom-[10%]">
          <div className="bg-gray-800 w-20 h-8 rounded-md border border-gray-600" />
          <div className="bg-gray-800 w-20 h-8 rounded-md border border-gray-600" />
          <div className="bg-gray-800 w-20 h-8 rounded-md border border-gray-600" />
        </div>

        {/* Side Buttons */}
        <div className="absolute left-[-4%] top-[18.5%] bg-black h-[4%] w-[2%]" />
        <div className="absolute left-[-4%] top-[26%] bg-black h-[7.5%] w-[2%]" />
        <div className="absolute left-[-4%] top-[36%] bg-black h-[7.5%] w-[2%]" />
      </div>
    </div>
  );
};

export default Phone;
