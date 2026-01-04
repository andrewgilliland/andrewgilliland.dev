"use client";
import BlackMage from "@/components/svg/pixel-art/BlackMage";
import RedMage from "@/components/svg/pixel-art/RedMage";
import Fighter from "@/components/svg/pixel-art/Fighter";
import WhiteMage from "@/components/svg/pixel-art/WhiteMage";
import Thief from "@/components/svg/pixel-art/Thief";
import Monk from "@/components/svg/pixel-art/Monk";
import Garland from "@/components/svg/pixel-art/Garland";
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
  const battleState = {
    ready: "ready",
    attack: "attack",
    cast: "cast",
    defend: "defend",
    hurt: "hurt",
    dead: "dead",
  };

  const initialBattleStore = {
    characters: [
      "fighter",
      "blackMage",
      "whiteMage",
      "thief",
      "redMage",
      "monk",
    ],
    activeCharacter: "fighter",
    battleState: battleState.ready,
    enemy: { name: "Garland", health: 1000 },
  };

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
      <h3 className="font-semibold text-2xl">Final Fantasy</h3>
      <div className="flex justify-between gap-4 mt-4">
        <div className="flex flex-col justify-between border-4 border-white rounded p-1 w-full">
          <div className="p-4">
            <Garland />
          </div>
          <div className="flex gap-1">
            <div className="flex flex-col justify-between border-4 border-white rounded p-2 w-full">
              <div>Garland</div>
            </div>
            <div className="border-4 border-white rounded">
              <button
                onClick={() => {
                  // Todo: Implement attack function
                  // !This needs fixed
                  // This is a comment
                  // * This is a note
                  // ? What is this

                  console.log("Attacking");
                }}
                className="bg-black text-white px-4 py-1"
              >
                Attack
              </button>
              <button onClick={cast} className="bg-black text-white px-4 py-1">
                Cast
              </button>
              <button
                onClick={defend}
                className="bg-black text-white px-4 py-1"
              >
                Defend
              </button>
            </div>
          </div>
        </div>
        <div className="border-4 border-white rounded py-4 pl-24 pr-4">
          <Fighter />
          <div className="transition hover:-translate-x-10 ">
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
