"use client";
import BlackMage from "@/components/react/svg/pixel-art/BlackMage";
import RedMage from "@/components/react/svg/pixel-art/RedMage";
import Fighter from "@/components/react/svg/pixel-art/Fighter";
import WhiteMage from "@/components/react/svg/pixel-art/WhiteMage";
import Thief from "@/components/react/svg/pixel-art/Thief";
import Monk from "@/components/react/svg/pixel-art/Monk";
import Garland from "@/components/react/svg/pixel-art/Garland";
import { useState } from "react";
import Nemo from "./svg/pixel-art/Nemo";
import Chocobo from "./svg/pixel-art/Chocobo";

export type BattleState =
  | "ready"
  | "attack"
  | "cast"
  | "defend"
  | "hurt"
  | "dead";

const Battle = () => {
  const [blackMage, setBlackMage] = useState<BattleState>("ready");

  const cast = () => {
    console.log("Casting spell");
    setBlackMage("cast");
    setTimeout(() => {
      setBlackMage("ready");
    }, 2000);
  };

  const defend = () => {
    console.log("Defending");
    setBlackMage("defend");
    setTimeout(() => {
      setBlackMage("ready");
    }, 2000);
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold">Final Fantasy</h3>
      <div className="mt-4 flex justify-between gap-4">
        <div className="flex w-full flex-col justify-between rounded border-4 border-white p-1">
          <div className="p-4">
            <Garland />
          </div>
          <div className="flex gap-1">
            <div className="flex w-full flex-col justify-between rounded border-4 border-white p-2">
              <div>Garland</div>
            </div>
            <div className="rounded border-4 border-white">
              <button
                onClick={() => {
                  // Todo: Implement attack function
                  // !This needs fixed
                  // This is a comment
                  // * This is a note
                  // ? What is this

                  console.log("Attacking");
                }}
                className="bg-black px-4 py-1 text-white"
              >
                Attack
              </button>
              <button onClick={cast} className="bg-black px-4 py-1 text-white">
                Cast
              </button>
              <button
                onClick={defend}
                className="bg-black px-4 py-1 text-white"
              >
                Defend
              </button>
            </div>
          </div>
        </div>
        <div className="rounded border-4 border-white py-4 pl-24 pr-4">
          <Fighter />
          <div className="transition hover:-translate-x-10">
            <BlackMage state={blackMage} />
          </div>
          <WhiteMage />
          <Thief />
          <RedMage />
          <Monk />
          <Nemo />
          <Chocobo />
        </div>
      </div>
    </div>
  );
};

export default Battle;
