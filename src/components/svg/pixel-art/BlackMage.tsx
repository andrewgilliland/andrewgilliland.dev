"use client";
import { BattleState } from "@/components/Battle";
import { FC } from "react";
import colors from "tailwindcss/colors";

type BlackMageProps = {
  color?: string;
  state?: BattleState;
};

const BlackMage: FC<BlackMageProps> = ({ color = "blue", state = "ready" }) => {
  const robe = colors[color][600];
  const secondary = colors.amber[300];
  const hat = {
    dark: colors.amber[900],
    light: colors.amber[600],
  };

  console.log("state: ", state);

  const renderMageState = () => {
    switch (state) {
      case "ready":
        return (
          <g>
            <g>
              <rect x="150" width="10" height="10" fill="black" />
              <rect x="140" width="10" height="10" fill="black" />
              <rect x="160" y="10" width="10" height="10" fill="black" />
              <rect x="160" y="20" width="10" height="10" fill="black" />
              <rect x="150" y="30" width="10" height="10" fill="black" />
              <rect x="150" y="40" width="10" height="10" fill="black" />
              <rect x="140" y="50" width="10" height="10" fill="black" />
              <rect x="140" y="60" width="10" height="10" fill="black" />
              <rect x="140" y="70" width="10" height="10" fill="black" />
              <rect x="130" y="10" width="10" height="10" fill="black" />
              <rect x="120" y="10" width="10" height="10" fill="black" />
              <rect x="110" y="20" width="10" height="10" fill="black" />
              <rect x="100" y="30" width="10" height="10" fill="black" />
              <rect x="90" y="30" width="10" height="10" fill="black" />
              <rect x="80" y="40" width="10" height="10" fill="black" />
              <rect x="70" y="40" width="10" height="10" fill="black" />
              <rect x="60" y="50" width="10" height="10" fill="black" />
              <rect x="50" y="50" width="10" height="10" fill="black" />
              <rect x="40" y="50" width="10" height="10" fill="black" />
              <rect x="30" y="50" width="10" height="10" fill="black" />
              <rect x="20" y="50" width="10" height="10" fill="black" />
              <rect x="10" y="50" width="10" height="10" fill="black" />
              <rect y="60" width="10" height="10" fill="black" />
              <rect x="10" y="70" width="10" height="10" fill="black" />
              <rect x="20" y="80" width="10" height="10" fill="black" />
              <rect x="30" y="80" width="10" height="10" fill="black" />
              <rect x="40" y="80" width="10" height="10" fill="black" />
              <rect x="50" y="90" width="10" height="10" fill="black" />
              <rect x="40" y="110" width="10" height="10" fill="black" />
              <rect x="40" y="120" width="10" height="10" fill="black" />
              <rect x="50" y="120" width="10" height="10" fill="black" />
              <rect x="50" y="130" width="10" height="10" fill="black" />
              <rect x="60" y="130" width="10" height="10" fill="black" />
              <rect x="60" y="120" width="10" height="10" fill="black" />
              <rect x="60" y="110" width="10" height="10" fill="black" />
              <rect x="60" y="100" width="10" height="10" fill="black" />
              <rect x="70" y="100" width="10" height="10" fill="black" />
              <rect x="70" y="110" width="10" height="10" fill="black" />
              <rect x="90" y="110" width="10" height="10" fill="black" />
              <rect x="100" y="110" width="10" height="10" fill="black" />
              <rect x="110" y="120" width="10" height="10" fill="black" />
              <rect x="100" y="120" width="10" height="10" fill="black" />
              <rect x="90" y="120" width="10" height="10" fill="black" />
              <rect x="70" y="120" width="10" height="10" fill="black" />
              <rect x="30" y="130" width="10" height="10" fill="black" />
              <rect x="60" y="90" width="10" height="10" fill="black" />
              <rect x="70" y="90" width="10" height="10" fill="black" />
              <rect x="80" y="100" width="10" height="10" fill="black" />
              <rect x="90" y="100" width="10" height="10" fill="black" />
              <rect x="100" y="100" width="10" height="10" fill="black" />
              <rect x="110" y="110" width="10" height="10" fill="black" />
              <rect x="120" y="110" width="10" height="10" fill="black" />
              <rect x="120" y="120" width="10" height="10" fill="black" />
              <rect x="120" y="130" width="10" height="10" fill="black" />
              <rect x="130" y="130" width="10" height="10" fill="black" />
              <rect x="140" y="120" width="10" height="10" fill="black" />
              <rect x="150" y="130" width="10" height="10" fill="black" />
              <rect x="160" y="130" width="10" height="10" fill="black" />
              <rect x="150" y="140" width="10" height="10" fill="black" />
              <rect x="140" y="150" width="10" height="10" fill="black" />
              <rect x="170" y="120" width="11" height="10" fill="black" />
              <rect x="160" y="110" width="11" height="10" fill="black" />
              <rect x="150" y="100" width="11" height="10" fill="black" />
              <rect x="140" y="90" width="11" height="10" fill="black" />
              <rect x="130" y="80" width="11" height="10" fill="black" />
              <rect x="150" y="160" width="10" height="10" fill="black" />
              <rect x="150" y="170" width="10" height="10" fill="black" />
              <rect x="150" y="180" width="10" height="10" fill="black" />
              <rect x="150" y="190" width="10" height="10" fill="black" />
              <rect x="140" y="200" width="10" height="10" fill="black" />
              <rect x="140" y="210" width="10" height="10" fill="black" />
              <rect x="140" y="220" width="10" height="10" fill="black" />
              <rect x="150" y="230" width="10" height="10" fill="black" />
              <rect x="160" y="240" width="10" height="10" fill="black" />
              <rect x="150" y="250" width="10" height="10" fill="black" />
              <rect x="140" y="250" width="10" height="10" fill="black" />
              <rect x="130" y="250" width="10" height="10" fill="black" />
              <rect x="120" y="240" width="10" height="10" fill="black" />
              <rect x="110" y="240" width="10" height="10" fill="black" />
              <rect x="100" y="250" width="10" height="10" fill="black" />
              <rect x="90" y="250" width="10" height="10" fill="black" />
              <rect x="80" y="250" width="10" height="10" fill="black" />
              <rect x="70" y="250" width="10" height="10" fill="black" />
              <rect x="60" y="250" width="10" height="10" fill="black" />
              <rect x="50" y="250" width="10" height="10" fill="black" />
              <rect x="40" y="250" width="10" height="10" fill="black" />
              <rect x="30" y="250" width="10" height="10" fill="black" />
              <rect x="20" y="250" width="10" height="10" fill="black" />
              <rect x="10" y="250" width="10" height="10" fill="black" />
              <rect y="240" width="10" height="10" fill="black" />
              <rect x="10" y="230" width="10" height="10" fill="black" />
              <rect x="10" y="220" width="10" height="10" fill="black" />
              <rect x="10" y="210" width="10" height="10" fill="black" />
              <rect x="10" y="200" width="10" height="10" fill="black" />
              <rect x="10" y="190" width="10" height="10" fill="black" />
              <rect x="10" y="180" width="10" height="10" fill="black" />
              <rect x="20" y="180" width="10" height="10" fill="black" />
              <rect y="170" width="10" height="10" fill="black" />
              <rect y="160" width="10" height="10" fill="black" />
              <rect x="10" y="150" width="10" height="10" fill="black" />
              <rect x="20" y="150" width="10" height="10" fill="black" />
              <rect x="30" y="160" width="10" height="10" fill="black" />
              <rect x="30" y="170" width="10" height="10" fill="black" />
              <rect x="10" y="140" width="10" height="10" fill="black" />
              <rect x="10" y="130" width="10" height="10" fill="black" />
              <rect x="20" y="120" width="10" height="10" fill="black" />
              <rect x="30" y="110" width="10" height="10" fill="black" />
              <rect x="40" y="100" width="10" height="10" fill="black" />
              <rect x="30" y="130" width="10" height="10" fill="black" />
              <rect x="40" y="130" width="10" height="10" fill="black" />
              <rect x="50" y="140" width="10" height="10" fill="black" />
              <rect x="60" y="140" width="10" height="10" fill="black" />
              <rect x="70" y="140" width="10" height="10" fill="black" />
              <rect x="70" y="130" width="10" height="10" fill="black" />
              <rect x="80" y="130" width="10" height="10" fill="black" />
              <rect x="90" y="130" width="10" height="10" fill="black" />
              <rect x="100" y="130" width="10" height="10" fill="black" />
              <rect x="110" y="130" width="10" height="10" fill="black" />
              <rect x="100" y="230" width="10" height="10" fill="black" />
              <rect x="90" y="220" width="10" height="10" fill="black" />
              <rect x="90" y="210" width="10" height="10" fill="black" />
              <rect x="80" y="200" width="10" height="10" fill="black" />
              <rect x="70" y="200" width="10" height="10" fill="black" />
              <rect x="80" y="190" width="10" height="10" fill="black" />
              <rect x="60" y="200" width="10" height="10" fill="black" />
              <rect x="80" y="180" width="10" height="10" fill="black" />
              <rect x="80" y="170" width="10" height="10" fill="black" />
              <rect x="70" y="170" width="10" height="10" fill="black" />
              <rect x="60" y="170" width="10" height="10" fill="black" />
              <rect x="70" y="160" width="10" height="10" fill="black" />
              <rect x="80" y="160" width="10" height="10" fill="black" />
              <rect x="90" y="150" width="10" height="10" fill="black" />
              <rect x="100" y="150" width="10" height="10" fill="black" />
              <rect x="110" y="150" width="10" height="10" fill="black" />
              <rect x="130" y="230" width="10" height="10" fill="black" />
            </g>
            <g>
              <rect
                className="transition-colors duration-700"
                x="20"
                y="130"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="20"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="60"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="70"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="80"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="80"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="140"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="130"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="120"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="120"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="60"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="160"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="150"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="110"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="120"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="170"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="180"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="20"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="190"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="20"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="200"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="20"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="60"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="70"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="80"
                y="210"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="20"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="60"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="70"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="80"
                y="220"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="20"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="60"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="70"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="80"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="230"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="10"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="20"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="30"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="40"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="50"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="60"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="70"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="80"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="90"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="100"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="130"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="140"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
              <rect
                className="transition-colors duration-700"
                x="150"
                y="240"
                width="10"
                height="10"
                fill={robe}
              />
            </g>
            <g>
              <rect x="160" y="120" width="10" height="10" fill={hat.dark} />
              <rect x="150" y="120" width="10" height="10" fill={hat.dark} />
              <rect x="150" y="110" width="10" height="10" fill={hat.dark} />
              <rect x="140" y="110" width="10" height="10" fill={hat.dark} />
              <rect x="130" y="110" width="10" height="10" fill={hat.dark} />
              <rect x="140" y="100" width="10" height="10" fill={hat.dark} />
              <rect x="130" y="100" width="10" height="10" fill={hat.dark} />
              <rect x="120" y="100" width="10" height="10" fill={hat.dark} />
              <rect x="110" y="100" width="10" height="10" fill={hat.dark} />
              <rect x="130" y="90" width="10" height="10" fill={hat.dark} />
              <rect x="120" y="90" width="10" height="10" fill={hat.dark} />
              <rect x="110" y="90" width="10" height="10" fill={hat.dark} />
              <rect x="100" y="90" width="10" height="10" fill={hat.dark} />
              <rect x="90" y="90" width="10" height="10" fill={hat.dark} />
              <rect x="80" y="90" width="10" height="10" fill={hat.dark} />
              <rect x="120" y="80" width="10" height="10" fill={hat.dark} />
              <rect x="80" y="80" width="10" height="10" fill={hat.dark} />
              <rect x="70" y="80" width="10" height="10" fill={hat.dark} />
              <rect x="60" y="80" width="10" height="10" fill={hat.dark} />
              <rect x="50" y="80" width="10" height="10" fill={hat.dark} />
              <rect x="50" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="40" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="30" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="20" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="130" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="120" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="110" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="100" y="70" width="10" height="10" fill={hat.dark} />
              <rect x="130" y="60" width="10" height="10" fill={hat.dark} />
              <rect x="120" y="60" width="10" height="10" fill={hat.dark} />
              <rect x="110" y="60" width="10" height="10" fill={hat.dark} />
              <rect x="100" y="60" width="10" height="10" fill={hat.dark} />
              <rect x="90" y="60" width="10" height="10" fill={hat.dark} />
              <rect x="130" y="50" width="10" height="10" fill={hat.dark} />
              <rect x="120" y="50" width="10" height="10" fill={hat.dark} />
              <rect x="110" y="50" width="10" height="10" fill={hat.dark} />
              <rect x="140" y="40" width="10" height="10" fill={hat.dark} />
              <rect x="130" y="40" width="10" height="10" fill={hat.dark} />
              <rect x="140" y="30" width="10" height="10" fill={hat.dark} />
              <rect x="150" y="20" width="10" height="10" fill={hat.dark} />
              <rect x="140" y="10" width="10" height="10" fill={hat.light} />
              <rect x="150" y="10" width="10" height="10" fill={hat.light} />
              <rect x="140" y="20" width="10" height="10" fill={hat.light} />
              <rect x="130" y="30" width="10" height="10" fill={hat.light} />
              <rect x="120" y="40" width="10" height="10" fill={hat.light} />
              <rect x="130" y="20" width="10" height="10" fill={hat.light} />
              <rect x="120" y="20" width="10" height="10" fill={hat.light} />
              <rect x="120" y="30" width="10" height="10" fill={hat.light} />
              <rect x="110" y="30" width="10" height="10" fill={hat.light} />
              <rect x="110" y="40" width="10" height="10" fill={hat.light} />
              <rect x="100" y="40" width="10" height="10" fill={hat.light} />
              <rect x="90" y="40" width="10" height="10" fill={hat.light} />
              <rect x="100" y="50" width="10" height="10" fill={hat.light} />
              <rect x="90" y="50" width="10" height="10" fill={hat.light} />
              <rect x="80" y="50" width="10" height="10" fill={hat.light} />
              <rect x="70" y="50" width="10" height="10" fill={hat.light} />
              <rect x="80" y="60" width="10" height="10" fill={hat.light} />
              <rect x="70" y="60" width="10" height="10" fill={hat.light} />
              <rect x="60" y="60" width="10" height="10" fill={hat.light} />
              <rect x="50" y="60" width="10" height="10" fill={hat.light} />
              <rect x="40" y="60" width="10" height="10" fill={hat.light} />
              <rect x="30" y="60" width="10" height="10" fill={hat.light} />
              <rect x="20" y="60" width="10" height="10" fill={hat.light} />
              <rect x="10" y="60" width="10" height="10" fill={hat.light} />
              <rect x="90" y="70" width="10" height="10" fill={hat.light} />
              <rect x="80" y="70" width="10" height="10" fill={hat.light} />
              <rect x="70" y="70" width="10" height="10" fill={hat.light} />
              <rect x="60" y="70" width="10" height="10" fill={hat.light} />
              <rect x="110" y="80" width="10" height="10" fill={hat.light} />
              <rect x="100" y="80" width="10" height="10" fill={hat.light} />
              <rect x="90" y="80" width="10" height="10" fill={hat.light} />
            </g>
            <g>
              <rect x="70" y="190" width="10" height="10" fill={secondary} />
              <rect x="60" y="190" width="10" height="10" fill={secondary} />
              <rect x="70" y="180" width="10" height="10" fill={secondary} />
              <rect x="60" y="180" width="10" height="10" fill={secondary} />
              <rect x="20" y="170" width="10" height="10" fill={secondary} />
              <rect x="10" y="170" width="10" height="10" fill={secondary} />
              <rect x="20" y="160" width="10" height="10" fill={secondary} />
              <rect x="10" y="160" width="10" height="10" fill={secondary} />
              <rect x="50" y="110" width="10" height="10" fill={secondary} />
              <rect x="50" y="100" width="10" height="10" fill={secondary} />
              <rect x="80" y="110" width="10" height="10" fill={secondary} />
              <rect x="80" y="120" width="10" height="10" fill={secondary} />
            </g>
          </g>
        );

      case "cast":
        return (
          <g>
            <rect x="150" width="10" height="10" fill="black" />
            <rect x="140" width="10" height="10" fill="black" />
            <rect x="160" y="10" width="10" height="10" fill="black" />
            <rect x="160" y="20" width="10" height="10" fill="black" />
            <rect x="150" y="30" width="10" height="10" fill="black" />
            <rect x="150" y="40" width="10" height="10" fill="black" />
            <rect x="140" y="50" width="10" height="10" fill="black" />
            <rect x="140" y="60" width="10" height="10" fill="black" />
            <rect x="140" y="70" width="10" height="10" fill="black" />
            <rect x="130" y="10" width="10" height="10" fill="black" />
            <rect x="120" y="10" width="10" height="10" fill="black" />
            <rect x="110" y="20" width="10" height="10" fill="black" />
            <rect x="100" y="30" width="10" height="10" fill="black" />
            <rect x="90" y="30" width="10" height="10" fill="black" />
            <rect x="80" y="40" width="10" height="10" fill="black" />
            <rect x="70" y="40" width="10" height="10" fill="black" />
            <rect x="60" y="50" width="10" height="10" fill="black" />
            <rect x="50" y="50" width="10" height="10" fill="black" />
            <rect x="40" y="50" width="10" height="10" fill="black" />
            <rect x="30" y="50" width="10" height="10" fill="black" />
            <rect x="20" y="50" width="10" height="10" fill="black" />
            <rect x="10" y="50" width="10" height="10" fill="black" />
            <rect y="60" width="10" height="10" fill="black" />
            <rect x="10" y="70" width="10" height="10" fill="black" />
            <rect x="20" y="80" width="10" height="10" fill="black" />
            <rect x="30" y="80" width="10" height="10" fill="black" />
            <rect x="40" y="80" width="10" height="10" fill="black" />
            <rect x="50" y="90" width="10" height="10" fill="black" />
            <rect x="40" y="110" width="10" height="10" fill="black" />
            <rect x="40" y="120" width="10" height="10" fill="black" />
            <rect x="50" y="120" width="10" height="10" fill="black" />
            <rect x="50" y="130" width="10" height="10" fill="black" />
            <rect x="60" y="130" width="10" height="10" fill="black" />
            <rect x="60" y="120" width="10" height="10" fill="black" />
            <rect x="60" y="110" width="10" height="10" fill="black" />
            <rect x="60" y="100" width="10" height="10" fill="black" />
            <rect x="70" y="100" width="10" height="10" fill="black" />
            <rect x="70" y="110" width="10" height="10" fill="black" />
            <rect x="90" y="110" width="10" height="10" fill="black" />
            <rect x="100" y="110" width="10" height="10" fill="black" />
            <rect x="110" y="120" width="10" height="10" fill="black" />
            <rect x="100" y="120" width="10" height="10" fill="black" />
            <rect x="90" y="120" width="10" height="10" fill="black" />
            <rect x="70" y="120" width="10" height="10" fill="black" />
            <rect x="30" y="130" width="10" height="10" fill="black" />
            <rect x="60" y="90" width="10" height="10" fill="black" />
            <rect x="70" y="90" width="10" height="10" fill="black" />
            <rect x="80" y="100" width="10" height="10" fill="black" />
            <rect x="90" y="100" width="10" height="10" fill="black" />
            <rect x="100" y="100" width="10" height="10" fill="black" />
            <rect x="110" y="110" width="10" height="10" fill="black" />
            <rect x="120" y="110" width="10" height="10" fill="black" />
            <rect x="120" y="120" width="10" height="10" fill="black" />
            <rect x="120" y="130" width="10" height="10" fill="black" />
            <rect x="130" y="130" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="120" width="10" height="10" fill="black" />
            <rect x="150" y="130" width="10" height="10" fill="black" />
            <rect x="160" y="130" width="10" height="10" fill="black" />
            <rect x="150" y="140" width="10" height="10" fill="black" />
            <rect x="140" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="150" width="10" height="10" fill="black" />
            <rect x="170" y="120" width="11" height="10" fill="black" />
            <rect x="160" y="110" width="11" height="10" fill="black" />
            <rect x="150" y="100" width="11" height="10" fill="black" />
            <rect x="140" y="90" width="11" height="10" fill="black" />
            <rect x="130" y="80" width="11" height="10" fill="black" />
            <rect x="150" y="160" width="10" height="10" fill="black" />
            <rect x="150" y="170" width="10" height="10" fill="black" />
            <rect x="150" y="180" width="10" height="10" fill="black" />
            <rect x="150" y="190" width="10" height="10" fill="black" />
            <rect x="140" y="200" width="10" height="10" fill="black" />
            <rect x="150" y="210" width="10" height="10" fill="black" />
            <rect x="150" y="220" width="10" height="10" fill="black" />
            <rect x="160" y="230" width="10" height="10" fill="black" />
            <rect x="170" y="240" width="10" height="10" fill="black" />
            <rect x="140" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="160" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="250" width="10" height="10" fill="black" />
            <rect x="140" y="250" width="10" height="10" fill="black" />
            <rect x="130" y="250" width="10" height="10" fill="black" />
            <rect x="120" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="250" width="10" height="10" fill="black" />
            <rect x="90" y="250" width="10" height="10" fill="black" />
            <rect x="60" y="250" width="10" height="10" fill="black" />
            <rect x="50" y="250" width="10" height="10" fill="black" />
            <rect x="40" y="250" width="10" height="10" fill="black" />
            <rect x="30" y="250" width="10" height="10" fill="black" />
            <rect x="20" y="250" width="10" height="10" fill="black" />
            <rect x="10" y="250" width="10" height="10" fill="black" />
            <rect y="240" width="10" height="10" fill="black" />
            <rect x="10" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="220" width="10" height="10" fill="black" />
            <rect x="30" y="220" width="10" height="10" fill="black" />
            <rect y="220" width="10" height="10" fill="black" />
            <rect x="10" y="210" width="10" height="10" fill="black" />
            <rect x="10" y="200" width="10" height="10" fill="black" />
            <rect x="10" y="190" width="10" height="10" fill="black" />
            <rect x="10" y="180" width="10" height="10" fill="black" />
            <rect y="170" width="10" height="10" fill="black" />
            <rect y="160" width="10" height="10" fill="black" />
            <rect y="150" width="10" height="10" fill="black" />
            <rect y="140" width="10" height="10" fill="black" />
            <rect y="130" width="10" height="10" fill="black" />
            <rect y="120" width="10" height="10" fill="black" />
            <rect x="10" y="110" width="10" height="10" fill="black" />
            <rect x="20" y="110" width="10" height="10" fill="black" />
            <rect x="30" y="160" width="10" height="10" fill="black" />
            <rect x="30" y="170" width="10" height="10" fill="black" />
            <rect x="30" y="150" width="10" height="10" fill="black" />
            <rect x="20" y="170" width="10" height="10" fill="black" />
            <rect x="10" y="140" width="10" height="10" fill="black" />
            <rect x="20" y="140" width="10" height="10" fill="black" />
            <rect x="10" y="130" width="10" height="10" fill="black" />
            <rect x="20" y="120" width="10" height="10" fill="black" />
            <rect x="30" y="110" width="10" height="10" fill="black" />
            <rect x="40" y="100" width="10" height="10" fill="black" />
            <rect x="40" y="100" width="10" height="10" fill="black" />
            <rect x="30" y="130" width="10" height="10" fill="black" />
            <rect x="40" y="130" width="10" height="10" fill="black" />
            <rect x="50" y="140" width="10" height="10" fill="black" />
            <rect x="60" y="140" width="10" height="10" fill="black" />
            <rect x="70" y="140" width="10" height="10" fill="black" />
            <rect x="70" y="130" width="10" height="10" fill="black" />
            <rect x="80" y="130" width="10" height="10" fill="black" />
            <rect x="90" y="130" width="10" height="10" fill="black" />
            <rect x="100" y="130" width="10" height="10" fill="black" />
            <rect x="110" y="130" width="10" height="10" fill="black" />
            <rect x="100" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="180" width="10" height="10" fill="black" />
            <rect x="80" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="150" width="10" height="10" fill="black" />
            <rect x="110" y="150" width="10" height="10" fill="black" />
            <rect x="10" y="230" width="10" height="10" fill="black" />
            <rect x="161" y="250" width="10" height="10" fill="black" />
            <rect x="120" y="250" width="10" height="10" fill="black" />
            <rect x="110" y="250" width="10" height="10" fill="black" />
            <rect y="250" width="10" height="10" fill="black" />
            <rect x="130" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="140" width="10" height="10" fill="black" />
            <rect x="40" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="140" width="10" height="10" fill="black" />
            <rect x="90" y="140" width="10" height="10" fill="black" />
            <rect x="100" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="140" width="10" height="10" fill="black" />
            <rect x="140" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="130" width="10" height="10" fill="black" />
            <rect x="130" y="120" width="10" height="10" fill="black" />
            <rect x="30" y="120" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="150" width="10" height="10" fill="black" />
            <rect x="130" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="180" width="10" height="10" fill="black" />
            <rect x="40" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="190" width="10" height="10" fill="black" />
            <rect x="40" y="190" width="10" height="10" fill="black" />
            <rect x="50" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="200" width="10" height="10" fill="black" />
            <rect x="50" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="210" width="10" height="10" fill="black" />
            <rect x="50" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="220" width="10" height="10" fill="black" />
            <rect x="50" y="220" width="10" height="10" fill="black" />
            <rect x="60" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="230" width="10" height="10" fill="#FCD34D" />
            <rect x="30" y="230" width="10" height="10" fill="#FCD34D" />
            <rect x="40" y="230" width="10" height="10" fill="black" />
            <rect x="50" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="230" width="10" height="10" fill="black" />
            <rect x="70" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="10" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="20" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="30" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="40" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="50" y="240" width="10" height="10" fill="black" />
            <rect x="60" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="240" width="10" height="10" fill="black" />
            <rect x="80" y="240" width="10" height="10" fill="black" />
            <rect x="80" y="120" width="10" height="10" fill="#FCD34D" />
            <rect x="80" y="110" width="10" height="10" fill="#FCD34D" />
            <rect x="50" y="110" width="10" height="10" fill="#FCD34D" />
            <rect x="50" y="100" width="10" height="10" fill="#FCD34D" />
            <rect x="90" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="160" y="120" width="10" height="10" fill="#78350F" />
            <rect x="150" y="120" width="10" height="10" fill="#78350F" />
            <rect x="150" y="110" width="10" height="10" fill="#78350F" />
            <rect x="140" y="110" width="10" height="10" fill="#78350F" />
            <rect x="130" y="110" width="10" height="10" fill="#78350F" />
            <rect x="140" y="100" width="10" height="10" fill="#78350F" />
            <rect x="130" y="100" width="10" height="10" fill="#78350F" />
            <rect x="120" y="100" width="10" height="10" fill="#78350F" />
            <rect x="110" y="100" width="10" height="10" fill="#78350F" />
            <rect x="130" y="90" width="10" height="10" fill="#78350F" />
            <rect x="120" y="90" width="10" height="10" fill="#78350F" />
            <rect x="110" y="90" width="10" height="10" fill="#78350F" />
            <rect x="100" y="90" width="10" height="10" fill="#78350F" />
            <rect x="90" y="90" width="10" height="10" fill="#78350F" />
            <rect x="80" y="90" width="10" height="10" fill="#78350F" />
            <rect x="120" y="80" width="10" height="10" fill="#78350F" />
            <rect x="80" y="80" width="10" height="10" fill="#78350F" />
            <rect x="70" y="80" width="10" height="10" fill="#78350F" />
            <rect x="60" y="80" width="10" height="10" fill="#78350F" />
            <rect x="50" y="80" width="10" height="10" fill="#78350F" />
            <rect x="50" y="70" width="10" height="10" fill="#78350F" />
            <rect x="40" y="70" width="10" height="10" fill="#78350F" />
            <rect x="30" y="70" width="10" height="10" fill="#78350F" />
            <rect x="20" y="70" width="10" height="10" fill="#78350F" />
            <rect x="130" y="70" width="10" height="10" fill="#78350F" />
            <rect x="120" y="70" width="10" height="10" fill="#78350F" />
            <rect x="110" y="70" width="10" height="10" fill="#78350F" />
            <rect x="100" y="70" width="10" height="10" fill="#78350F" />
            <rect x="130" y="60" width="10" height="10" fill="#78350F" />
            <rect x="120" y="60" width="10" height="10" fill="#78350F" />
            <rect x="110" y="60" width="10" height="10" fill="#78350F" />
            <rect x="100" y="60" width="10" height="10" fill="#78350F" />
            <rect x="90" y="60" width="10" height="10" fill="#78350F" />
            <rect x="130" y="50" width="10" height="10" fill="#78350F" />
            <rect x="120" y="50" width="10" height="10" fill="#78350F" />
            <rect x="110" y="50" width="10" height="10" fill="#78350F" />
            <rect x="140" y="40" width="10" height="10" fill="#78350F" />
            <rect x="130" y="40" width="10" height="10" fill="#78350F" />
            <rect x="140" y="30" width="10" height="10" fill="#78350F" />
            <rect x="150" y="20" width="10" height="10" fill="#78350F" />
            <rect x="140" y="10" width="10" height="10" fill="#D97706" />
            <rect x="150" y="10" width="10" height="10" fill="#D97706" />
            <rect x="140" y="20" width="10" height="10" fill="#D97706" />
            <rect x="130" y="30" width="10" height="10" fill="#D97706" />
            <rect x="120" y="40" width="10" height="10" fill="#D97706" />
            <rect x="130" y="20" width="10" height="10" fill="#D97706" />
            <rect x="120" y="20" width="10" height="10" fill="#D97706" />
            <rect x="120" y="30" width="10" height="10" fill="#D97706" />
            <rect x="110" y="30" width="10" height="10" fill="#D97706" />
            <rect x="110" y="40" width="10" height="10" fill="#D97706" />
            <rect x="100" y="40" width="10" height="10" fill="#D97706" />
            <rect x="90" y="40" width="10" height="10" fill="#D97706" />
            <rect x="100" y="50" width="10" height="10" fill="#D97706" />
            <rect x="90" y="50" width="10" height="10" fill="#D97706" />
            <rect x="80" y="50" width="10" height="10" fill="#D97706" />
            <rect x="70" y="50" width="10" height="10" fill="#D97706" />
            <rect x="80" y="60" width="10" height="10" fill="#D97706" />
            <rect x="70" y="60" width="10" height="10" fill="#D97706" />
            <rect x="60" y="60" width="10" height="10" fill="#D97706" />
            <rect x="50" y="60" width="10" height="10" fill="#D97706" />
            <rect x="40" y="60" width="10" height="10" fill="#D97706" />
            <rect x="30" y="60" width="10" height="10" fill="#D97706" />
            <rect x="20" y="60" width="10" height="10" fill="#D97706" />
            <rect x="10" y="60" width="10" height="10" fill="#D97706" />
            <rect x="90" y="70" width="10" height="10" fill="#D97706" />
            <rect x="80" y="70" width="10" height="10" fill="#D97706" />
            <rect x="70" y="70" width="10" height="10" fill="#D97706" />
            <rect x="60" y="70" width="10" height="10" fill="#D97706" />
            <rect x="110" y="80" width="10" height="10" fill="#D97706" />
            <rect x="100" y="80" width="10" height="10" fill="#D97706" />
            <rect x="90" y="80" width="10" height="10" fill="#D97706" />
            <rect x="20" y="160" width="10" height="10" fill="#FCD34D" />
            <rect x="10" y="160" width="10" height="10" fill="#FCD34D" />
            <rect x="10" y="170" width="10" height="10" fill="#FCD34D" />
            <rect x="20" y="150" width="10" height="10" fill="#FCD34D" />
            <rect x="10" y="150" width="10" height="10" fill="#FCD34D" />
            <rect x="20" y="130" width="10" height="10" fill="#FCD34D" />
            <rect x="10" y="130" width="10" height="10" fill="#FCD34D" />
            <rect x="10" y="120" width="10" height="10" fill="#FCD34D" />
          </g>
        );

      case "defend":
        return (
          <g clip-path="url(#clip0_133_2)">
            <rect x="150" width="10" height="10" fill="black" />
            <rect x="140" width="10" height="10" fill="black" />
            <rect x="160" y="10" width="10" height="10" fill="black" />
            <rect x="160" y="20" width="10" height="10" fill="black" />
            <rect x="150" y="30" width="10" height="10" fill="black" />
            <rect x="150" y="40" width="10" height="10" fill="black" />
            <rect x="140" y="50" width="10" height="10" fill="black" />
            <rect x="140" y="60" width="10" height="10" fill="black" />
            <rect x="140" y="70" width="10" height="10" fill="black" />
            <rect x="130" y="10" width="10" height="10" fill="black" />
            <rect x="120" y="10" width="10" height="10" fill="black" />
            <rect x="110" y="20" width="10" height="10" fill="black" />
            <rect x="100" y="30" width="10" height="10" fill="black" />
            <rect x="90" y="30" width="10" height="10" fill="black" />
            <rect x="80" y="40" width="10" height="10" fill="black" />
            <rect x="70" y="40" width="10" height="10" fill="black" />
            <rect x="60" y="50" width="10" height="10" fill="black" />
            <rect x="50" y="50" width="10" height="10" fill="black" />
            <rect x="40" y="50" width="10" height="10" fill="black" />
            <rect x="30" y="50" width="10" height="10" fill="black" />
            <rect x="20" y="50" width="10" height="10" fill="black" />
            <rect x="10" y="50" width="10" height="10" fill="black" />
            <rect y="60" width="10" height="10" fill="black" />
            <rect x="10" y="70" width="10" height="10" fill="black" />
            <rect x="20" y="80" width="10" height="10" fill="black" />
            <rect x="30" y="80" width="10" height="10" fill="black" />
            <rect x="40" y="80" width="10" height="10" fill="black" />
            <rect x="40" y="90" width="10" height="10" fill="black" />
            <rect x="30" y="90" width="10" height="10" fill="black" />
            <rect x="20" y="100" width="10" height="10" fill="black" />
            <rect x="10" y="110" width="10" height="10" fill="black" />
            <rect x="10" y="120" width="10" height="10" fill="black" />
            <rect x="20" y="110" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="100" width="10" height="10" fill="black" />
            <rect x="50" y="90" width="10" height="10" fill="black" />
            <rect x="40" y="110" width="10" height="10" fill="black" />
            <rect x="40" y="120" width="10" height="10" fill="black" />
            <rect x="50" y="120" width="10" height="10" fill="black" />
            <rect x="50" y="130" width="10" height="10" fill="black" />
            <rect x="60" y="130" width="10" height="10" fill="black" />
            <rect x="60" y="120" width="10" height="10" fill="black" />
            <rect x="60" y="110" width="10" height="10" fill="black" />
            <rect x="60" y="100" width="10" height="10" fill="black" />
            <rect x="70" y="100" width="10" height="10" fill="black" />
            <rect x="70" y="110" width="10" height="10" fill="black" />
            <rect x="90" y="110" width="10" height="10" fill="black" />
            <rect x="100" y="110" width="10" height="10" fill="black" />
            <rect x="110" y="120" width="10" height="10" fill="black" />
            <rect x="100" y="120" width="10" height="10" fill="black" />
            <rect x="90" y="120" width="10" height="10" fill="black" />
            <rect x="70" y="120" width="10" height="10" fill="black" />
            <rect x="30" y="130" width="10" height="10" fill="black" />
            <rect x="60" y="90" width="10" height="10" fill="black" />
            <rect x="70" y="90" width="10" height="10" fill="black" />
            <rect x="80" y="100" width="10" height="10" fill="black" />
            <rect x="90" y="100" width="10" height="10" fill="black" />
            <rect x="100" y="100" width="10" height="10" fill="black" />
            <rect x="110" y="110" width="10" height="10" fill="black" />
            <rect x="120" y="110" width="10" height="10" fill="black" />
            <rect x="120" y="120" width="10" height="10" fill="black" />
            <rect x="120" y="130" width="10" height="10" fill="black" />
            <rect x="130" y="130" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="120" width="10" height="10" fill="black" />
            <rect x="150" y="130" width="10" height="10" fill="black" />
            <rect x="160" y="130" width="10" height="10" fill="black" />
            <rect x="150" y="140" width="10" height="10" fill="black" />
            <rect x="140" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="150" width="10" height="10" fill="black" />
            <rect x="170" y="120" width="11" height="10" fill="black" />
            <rect x="160" y="110" width="11" height="10" fill="black" />
            <rect x="150" y="100" width="11" height="10" fill="black" />
            <rect x="140" y="90" width="11" height="10" fill="black" />
            <rect x="130" y="80" width="11" height="10" fill="black" />
            <rect x="150" y="160" width="10" height="10" fill="black" />
            <rect x="150" y="170" width="10" height="10" fill="black" />
            <rect x="150" y="180" width="10" height="10" fill="black" />
            <rect x="150" y="190" width="10" height="10" fill="black" />
            <rect x="140" y="200" width="10" height="10" fill="black" />
            <rect x="140" y="210" width="10" height="10" fill="black" />
            <rect x="140" y="220" width="10" height="10" fill="black" />
            <rect x="150" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="210" width="10" height="10" fill="black" />
            <rect x="160" y="220" width="10" height="10" fill="black" />
            <rect x="160" y="230" width="10" height="10" fill="black" />
            <rect x="170" y="240" width="10" height="10" fill="black" />
            <rect x="160" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="250" width="10" height="10" fill="black" />
            <rect x="140" y="250" width="10" height="10" fill="black" />
            <rect x="130" y="250" width="10" height="10" fill="black" />
            <rect x="120" y="240" width="10" height="10" fill="black" />
            <rect x="110" y="240" width="10" height="10" fill="black" />
            <rect x="100" y="250" width="10" height="10" fill="black" />
            <rect x="90" y="250" width="10" height="10" fill="black" />
            <rect x="80" y="250" width="10" height="10" fill="black" />
            <rect x="70" y="250" width="10" height="10" fill="black" />
            <rect x="60" y="250" width="10" height="10" fill="black" />
            <rect x="50" y="250" width="10" height="10" fill="black" />
            <rect x="40" y="250" width="10" height="10" fill="black" />
            <rect x="30" y="250" width="10" height="10" fill="black" />
            <rect x="20" y="250" width="10" height="10" fill="black" />
            <rect x="10" y="250" width="10" height="10" fill="black" />
            <rect y="150" width="10" height="10" fill="black" />
            <rect y="140" width="10" height="10" fill="black" />
            <rect y="180" width="10" height="10" fill="black" />
            <rect y="190" width="10" height="10" fill="black" />
            <rect x="10" y="200" width="10" height="10" fill="black" />
            <rect x="10" y="220" width="10" height="10" fill="black" />
            <rect x="10" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="10" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="180" width="10" height="10" fill="black" />
            <rect y="170" width="10" height="10" fill="black" />
            <rect y="160" width="10" height="10" fill="black" />
            <rect x="10" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="10" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="10" y="130" width="10" height="10" fill="black" />
            <rect x="20" y="120" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="110" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="100" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="100" width="10" height="10" fill="black" />
            <rect x="30" y="130" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="130" width="10" height="10" fill="black" />
            <rect x="50" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="130" width="10" height="10" fill="black" />
            <rect x="80" y="130" width="10" height="10" fill="black" />
            <rect x="90" y="130" width="10" height="10" fill="black" />
            <rect x="100" y="130" width="10" height="10" fill="black" />
            <rect x="110" y="130" width="10" height="10" fill="black" />
            <rect x="100" y="230" width="10" height="10" fill="black" />
            <rect x="90" y="220" width="10" height="10" fill="black" />
            <rect x="90" y="210" width="10" height="10" fill="black" />
            <rect x="80" y="200" width="10" height="10" fill="black" />
            <rect x="70" y="200" width="10" height="10" fill="black" />
            <rect x="80" y="190" width="10" height="10" fill="black" />
            <rect x="60" y="200" width="10" height="10" fill="black" />
            <rect x="80" y="180" width="10" height="10" fill="black" />
            <rect x="80" y="170" width="10" height="10" fill="black" />
            <rect x="70" y="170" width="10" height="10" fill="black" />
            <rect x="60" y="170" width="10" height="10" fill="black" />
            <rect x="70" y="160" width="10" height="10" fill="black" />
            <rect x="80" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="150" width="10" height="10" fill="black" />
            <rect x="100" y="150" width="10" height="10" fill="black" />
            <rect x="110" y="150" width="10" height="10" fill="black" />
            <rect x="160" y="250" width="10" height="10" fill="black" />
            <rect x="130" y="230" width="10" height="10" fill="black" />
            <rect x="20" y="130" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="150" width="10" height="10" fill="black" />
            <rect x="80" y="140" width="10" height="10" fill="black" />
            <rect x="90" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="140" width="10" height="10" fill="black" />
            <rect x="140" y="140" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="130" width="10" height="10" fill="black" />
            <rect x="130" y="120" width="10" height="10" fill="black" />
            <rect x="30" y="120" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="150" width="10" height="10" fill="black" />
            <rect x="130" y="150" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="110" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="120" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="170" width="10" height="10" fill="black" />
            <rect x="30" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="180" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="180" width="10" height="10" fill="black" />
            <rect x="20" y="190" width="10" height="10" fill="black" />
            <rect x="30" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="190" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="190" width="10" height="10" fill="black" />
            <rect x="20" y="200" width="10" height="10" fill="black" />
            <rect x="30" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="200" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="210" width="10" height="10" fill="black" />
            <rect x="30" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="40" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="210" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="30" y="220" width="10" height="10" fill="black" />
            <rect x="40" y="220" width="10" height="10" fill="black" />
            <rect x="50" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="60" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="220" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="230" width="10" height="10" fill="black" />
            <rect x="30" y="230" width="10" height="10" fill="#FCD34D" />
            <rect x="40" y="230" width="10" height="10" fill="#FCD34D" />
            <rect x="50" y="230" width="10" height="10" fill="black" />
            <rect x="60" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="70" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="230" width="10" height="10" fill="#2563EB" />
            <rect x="10" y="240" width="10" height="10" fill="black" />
            <rect x="20" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="30" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="40" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="50" y="240" width="10" height="10" fill="#FCD34D" />
            <rect x="60" y="240" width="10" height="10" fill="black" />
            <rect x="70" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="80" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="90" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="100" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="130" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="140" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="150" y="240" width="10" height="10" fill="#2563EB" />
            <rect x="160" y="120" width="10" height="10" fill="#78350F" />
            <rect x="150" y="120" width="10" height="10" fill="#78350F" />
            <rect x="150" y="110" width="10" height="10" fill="#78350F" />
            <rect x="140" y="110" width="10" height="10" fill="#78350F" />
            <rect x="130" y="110" width="10" height="10" fill="#78350F" />
            <rect x="140" y="100" width="10" height="10" fill="#78350F" />
            <rect x="130" y="100" width="10" height="10" fill="#78350F" />
            <rect x="120" y="100" width="10" height="10" fill="#78350F" />
            <rect x="110" y="100" width="10" height="10" fill="#78350F" />
            <rect x="130" y="90" width="10" height="10" fill="#78350F" />
            <rect x="120" y="90" width="10" height="10" fill="#78350F" />
            <rect x="110" y="90" width="10" height="10" fill="#78350F" />
            <rect x="100" y="90" width="10" height="10" fill="#78350F" />
            <rect x="90" y="90" width="10" height="10" fill="#78350F" />
            <rect x="80" y="90" width="10" height="10" fill="#78350F" />
            <rect x="120" y="80" width="10" height="10" fill="#78350F" />
            <rect x="80" y="80" width="10" height="10" fill="#78350F" />
            <rect x="70" y="80" width="10" height="10" fill="#78350F" />
            <rect x="60" y="80" width="10" height="10" fill="#78350F" />
            <rect x="50" y="80" width="10" height="10" fill="#78350F" />
            <rect x="50" y="70" width="10" height="10" fill="#78350F" />
            <rect x="40" y="70" width="10" height="10" fill="#78350F" />
            <rect x="30" y="70" width="10" height="10" fill="#78350F" />
            <rect x="20" y="70" width="10" height="10" fill="#78350F" />
            <rect x="130" y="70" width="10" height="10" fill="#78350F" />
            <rect x="120" y="70" width="10" height="10" fill="#78350F" />
            <rect x="110" y="70" width="10" height="10" fill="#78350F" />
            <rect x="100" y="70" width="10" height="10" fill="#78350F" />
            <rect x="130" y="60" width="10" height="10" fill="#78350F" />
            <rect x="120" y="60" width="10" height="10" fill="#78350F" />
            <rect x="110" y="60" width="10" height="10" fill="#78350F" />
            <rect x="100" y="60" width="10" height="10" fill="#78350F" />
            <rect x="90" y="60" width="10" height="10" fill="#78350F" />
            <rect x="130" y="50" width="10" height="10" fill="#78350F" />
            <rect x="120" y="50" width="10" height="10" fill="#78350F" />
            <rect x="110" y="50" width="10" height="10" fill="#78350F" />
            <rect x="140" y="40" width="10" height="10" fill="#78350F" />
            <rect x="130" y="40" width="10" height="10" fill="#78350F" />
            <rect x="140" y="30" width="10" height="10" fill="#78350F" />
            <rect x="150" y="20" width="10" height="10" fill="#78350F" />
            <rect x="140" y="10" width="10" height="10" fill="#D97706" />
            <rect x="150" y="10" width="10" height="10" fill="#D97706" />
            <rect x="140" y="20" width="10" height="10" fill="#D97706" />
            <rect x="130" y="30" width="10" height="10" fill="#D97706" />
            <rect x="120" y="40" width="10" height="10" fill="#D97706" />
            <rect x="130" y="20" width="10" height="10" fill="#D97706" />
            <rect x="120" y="20" width="10" height="10" fill="#D97706" />
            <rect x="120" y="30" width="10" height="10" fill="#D97706" />
            <rect x="110" y="30" width="10" height="10" fill="#D97706" />
            <rect x="110" y="40" width="10" height="10" fill="#D97706" />
            <rect x="100" y="40" width="10" height="10" fill="#D97706" />
            <rect x="90" y="40" width="10" height="10" fill="#D97706" />
            <rect x="100" y="50" width="10" height="10" fill="#D97706" />
            <rect x="90" y="50" width="10" height="10" fill="#D97706" />
            <rect x="80" y="50" width="10" height="10" fill="#D97706" />
            <rect x="70" y="50" width="10" height="10" fill="#D97706" />
            <rect x="80" y="60" width="10" height="10" fill="#D97706" />
            <rect x="70" y="60" width="10" height="10" fill="#D97706" />
            <rect x="60" y="60" width="10" height="10" fill="#D97706" />
            <rect x="50" y="60" width="10" height="10" fill="#D97706" />
            <rect x="40" y="60" width="10" height="10" fill="#D97706" />
            <rect x="30" y="60" width="10" height="10" fill="#D97706" />
            <rect x="20" y="60" width="10" height="10" fill="#D97706" />
            <rect x="10" y="60" width="10" height="10" fill="#D97706" />
            <rect x="90" y="70" width="10" height="10" fill="#D97706" />
            <rect x="80" y="70" width="10" height="10" fill="#D97706" />
            <rect x="70" y="70" width="10" height="10" fill="#D97706" />
            <rect x="60" y="70" width="10" height="10" fill="#D97706" />
            <rect x="110" y="80" width="10" height="10" fill="#D97706" />
            <rect x="100" y="80" width="10" height="10" fill="#D97706" />
            <rect x="90" y="80" width="10" height="10" fill="#D97706" />
            <rect x="70" y="190" width="10" height="10" fill="#FCD34D" />
            <rect x="60" y="190" width="10" height="10" fill="#FCD34D" />
            <rect x="70" y="180" width="10" height="10" fill="#FCD34D" />
            <rect x="60" y="180" width="10" height="10" fill="#FCD34D" />
            <rect x="20" y="170" width="10" height="10" fill="black" />
            <rect x="10" y="170" width="10" height="10" fill="#2563EB" />
            <rect x="20" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="10" y="160" width="10" height="10" fill="#2563EB" />
            <rect x="50" y="110" width="10" height="10" fill="#FCD34D" />
            <rect x="50" y="100" width="10" height="10" fill="#FCD34D" />
            <rect x="80" y="110" width="10" height="10" fill="#FCD34D" />
            <rect x="80" y="120" width="10" height="10" fill="#FCD34D" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width="45"
      height="65"
      viewBox="0 0 180 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Black Mage</title>
      {renderMageState()}
    </svg>
  );
};

export default BlackMage;
