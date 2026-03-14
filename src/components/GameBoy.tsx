import { useState } from "react";

const GameBoy = () => {
  const [isOn, setIsOn] = useState(false);

  return (
    <div className="flex">
      <img
        className="opacity-50"
        src="/gameboy.jpeg"
        width={200}
        height={200}
        alt="Game Boy"
      />
      <div className="absolute h-[328px] w-[200px] p-[2px] opacity-100">
        <button
          onClick={() => setIsOn(!isOn)}
          className={`absolute ${
            isOn && "-translate-x-1"
          } bottom-[324px] right-[160px] h-1 w-3 rounded-t-sm border border-blue-500 bg-blue-500 transition`}
        />
        <div className="h-[322px] w-[194px] rounded-t-md rounded-bl-md rounded-br-[40px] border border-purple-500">
          <div className="h-4 rounded-t-md border-b border-purple-500 px-3.5">
            <div className="h-full border-l border-r border-purple-500" />
          </div>
          <div className="absolute bottom-[172px] right-[16px] h-[128px] w-[168px] rounded-t-lg rounded-bl-lg rounded-br-[30px] border border-yellow-500">
            <div
              className={`absolute ${
                isOn ? "bg-red-500" : "bg-black"
              } bottom-[75px] right-[150px] h-1.5 w-1.5 rounded-md border border-red-500 transition-colors`}
            />
            <div className="absolute bottom-4 right-[30px] h-[94px] w-[104px] rounded-sm border border-orange-500">
              <div
                className={`bg-green-900 ${
                  isOn ? "opacity-100" : "opacity-0"
                } h-full w-full transition`}
              ></div>
            </div>
          </div>
          <div className="absolute bottom-[80px] left-[15px] flex h-[50px] w-[50px] items-center justify-center stroke-blue-500 text-[110px] font-black">
            &#43;
          </div>
          <div className="absolute bottom-[47px] right-[114px] flex -rotate-[25deg] flex-col items-center">
            <div className="h-[8px] w-[25px] rounded-full border border-pink-500" />
            <div className="text-[6px] text-pink-500">SELECT</div>
          </div>
          <div className="absolute bottom-[47px] right-[81px] flex -rotate-[25deg] flex-col items-center">
            <button className="h-[8px] w-[25px] rounded-full border border-pink-500" />
            <div className="text-[6px] text-pink-500">START</div>
          </div>
          <div className="absolute bottom-[76px] right-[46px] flex -rotate-[25deg] flex-col items-center">
            <div className="h-[26px] w-[26px] rounded-full border border-green-500" />
            <div className="mt-1 text-[6px] text-green-500">B</div>
          </div>
          <div className="absolute bottom-[92px] right-[15px] flex -rotate-[25deg] flex-col items-center">
            <div className="h-[26px] w-[26px] rounded-full border border-green-500" />
            <div className="mt-1 text-[6px] text-green-500">A</div>
          </div>
          <div className="absolute bottom-[15px] right-[5px] flex h-[40px] w-[75px] -rotate-[28deg] justify-between px-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[32px] w-[6px] rounded-full border border-gray-700"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default GameBoy;
