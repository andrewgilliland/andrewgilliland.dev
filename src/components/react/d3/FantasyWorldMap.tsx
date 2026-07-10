import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type Faction = "azure" | "ember" | "verdant";
type ResourceType = "iron" | "herb" | "relic";
type QuestDifficulty = "easy" | "medium" | "hard";

type Region = {
  id: string;
  name: string;
  faction: Faction;
  points: [number, number][];
  label: [number, number];
};

type ResourceNode = {
  id: string;
  name: string;
  type: ResourceType;
  x: number;
  y: number;
  regionId: string;
};

type QuestNode = {
  id: string;
  title: string;
  difficulty: QuestDifficulty;
  x: number;
  y: number;
  completed: boolean;
  regionId: string;
};

const regions: Region[] = [
  {
    id: "northreach",
    name: "Northreach",
    faction: "azure",
    points: [
      [104, 132],
      [196, 104],
      [292, 110],
      [356, 164],
      [336, 238],
      [236, 286],
      [136, 256],
      [88, 196],
    ],
    label: [224, 202],
  },
  {
    id: "ashenvale",
    name: "Ashenvale",
    faction: "ember",
    points: [
      [340, 162],
      [470, 124],
      [604, 150],
      [694, 220],
      [688, 306],
      [596, 356],
      [466, 344],
      [372, 286],
      [336, 224],
    ],
    label: [514, 236],
  },
  {
    id: "thornwild",
    name: "Thornwild",
    faction: "verdant",
    points: [
      [84, 272],
      [170, 286],
      [260, 300],
      [338, 282],
      [386, 352],
      [368, 446],
      [302, 520],
      [186, 548],
      [96, 500],
      [66, 408],
    ],
    label: [224, 418],
  },
  {
    id: "sunfall",
    name: "Sunfall Coast",
    faction: "azure",
    points: [
      [344, 286],
      [472, 344],
      [604, 356],
      [720, 418],
      [738, 494],
      [674, 564],
      [542, 590],
      [406, 564],
      [342, 498],
      [324, 404],
    ],
    label: [548, 474],
  },
];

const continentOutline: [number, number][] = [
  [72, 188],
  [112, 112],
  [220, 72],
  [394, 86],
  [556, 104],
  [674, 154],
  [752, 252],
  [772, 384],
  [758, 500],
  [700, 582],
  [578, 624],
  [430, 626],
  [302, 610],
  [170, 566],
  [94, 500],
  [62, 396],
  [56, 282],
];

const resources: ResourceNode[] = [
  {
    id: "r-iron-1",
    name: "Frost Iron Vein",
    type: "iron",
    x: 196,
    y: 178,
    regionId: "northreach",
  },
  {
    id: "r-herb-1",
    name: "Moonleaf Grove",
    type: "herb",
    x: 202,
    y: 448,
    regionId: "thornwild",
  },
  {
    id: "r-relic-1",
    name: "Ashen Relic Cache",
    type: "relic",
    x: 536,
    y: 248,
    regionId: "ashenvale",
  },
  {
    id: "r-iron-2",
    name: "Stormrock Quarry",
    type: "iron",
    x: 586,
    y: 502,
    regionId: "sunfall",
  },
  {
    id: "r-herb-2",
    name: "Dewfen Bloom",
    type: "herb",
    x: 448,
    y: 528,
    regionId: "sunfall",
  },
];

const quests: QuestNode[] = [
  {
    id: "q-1",
    title: "Bandits at Frostpass",
    difficulty: "easy",
    x: 140,
    y: 232,
    completed: false,
    regionId: "northreach",
  },
  {
    id: "q-2",
    title: "The Ember Vault",
    difficulty: "hard",
    x: 576,
    y: 306,
    completed: false,
    regionId: "ashenvale",
  },
  {
    id: "q-3",
    title: "Rootwarden's Remedy",
    difficulty: "medium",
    x: 266,
    y: 470,
    completed: true,
    regionId: "thornwild",
  },
  {
    id: "q-4",
    title: "Smuggler's Tide",
    difficulty: "medium",
    x: 676,
    y: 518,
    completed: false,
    regionId: "sunfall",
  },
  {
    id: "q-5",
    title: "Crown of Cinders",
    difficulty: "hard",
    x: 444,
    y: 198,
    completed: false,
    regionId: "ashenvale",
  },
];

const factionColors: Record<Faction, string> = {
  azure: "#6f8bbf",
  ember: "#be7d55",
  verdant: "#7fa06a",
};

const resourceColors: Record<ResourceType, string> = {
  iron: "#95a3ad",
  herb: "#74966d",
  relic: "#d9b16f",
};

const questColors: Record<QuestDifficulty, string> = {
  easy: "#88ad7b",
  medium: "#c79b58",
  hard: "#b76760",
};

const seaPaths: [number, number][][] = [
  [
    [24, 178],
    [146, 148],
    [292, 188],
    [428, 244],
    [564, 244],
    [744, 300],
  ],
  [
    [32, 562],
    [184, 520],
    [324, 504],
    [476, 490],
    [618, 530],
    [782, 470],
  ],
];

const riverPath: [number, number][] = [
  [432, 128],
  [406, 194],
  [368, 244],
  [336, 304],
  [302, 362],
  [266, 432],
  [208, 516],
];

const forestClusters: [number, number][][] = [
  [
    [186, 370],
    [206, 348],
    [226, 378],
  ],
  [
    [252, 404],
    [272, 382],
    [292, 412],
  ],
  [
    [508, 420],
    [528, 398],
    [548, 430],
  ],
];

const mountainIcons: [number, number][] = [
  [272, 322],
  [304, 306],
  [556, 372],
  [588, 356],
];

export default function FantasyWorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeResourceTypes, setActiveResourceTypes] = useState<
    ResourceType[]
  >(["iron", "herb", "relic"]);
  const [activeDifficulties, setActiveDifficulties] = useState<
    QuestDifficulty[]
  >(["easy", "medium", "hard"]);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  const toggleResourceType = (type: ResourceType) => {
    setActiveResourceTypes((prev) =>
      prev.includes(type)
        ? prev.filter((value) => value !== type)
        : [...prev, type],
    );
  };

  const toggleDifficulty = (difficulty: QuestDifficulty) => {
    setActiveDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((value) => value !== difficulty)
        : [...prev, difficulty],
    );
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 840;
    const height = 680;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const defs = svg.append("defs");

    const oceanGradient = defs
      .append("linearGradient")
      .attr("id", "ocean-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
    oceanGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#2f4558");
    oceanGradient
      .append("stop")
      .attr("offset", "55%")
      .attr("stop-color", "#294155");
    oceanGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#1f3344");

    const parchmentGradient = defs
      .append("linearGradient")
      .attr("id", "parchment-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    parchmentGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#e7d5ab");
    parchmentGradient
      .append("stop")
      .attr("offset", "60%")
      .attr("stop-color", "#d9c292");
    parchmentGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#c9ae7a");

    const terrainPattern = defs
      .append("pattern")
      .attr("id", "terrain-grain")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 28)
      .attr("height", 28);
    terrainPattern
      .append("circle")
      .attr("cx", 5)
      .attr("cy", 8)
      .attr("r", 1.3)
      .attr("fill", "#fff2cf")
      .attr("opacity", 0.28);
    terrainPattern
      .append("circle")
      .attr("cx", 16)
      .attr("cy", 18)
      .attr("r", 1.1)
      .attr("fill", "#f4e5be")
      .attr("opacity", 0.24);

    const hatching = defs
      .append("pattern")
      .attr("id", "faction-hatch")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 10)
      .attr("height", 10)
      .attr("patternTransform", "rotate(22)");
    hatching
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 10)
      .attr("stroke", "#3f3224")
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.12);

    const mapClip = defs.append("clipPath").attr("id", "continent-clip");

    const glow = defs
      .append("filter")
      .attr("id", "region-glow")
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%");
    glow
      .append("feGaussianBlur")
      .attr("stdDeviation", 3.5)
      .attr("result", "blur");
    glow
      .append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "SourceGraphic"])
      .join("feMergeNode")
      .attr("in", (d) => d);

    const dropShadow = defs
      .append("filter")
      .attr("id", "map-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    dropShadow
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 6)
      .attr("stdDeviation", 7)
      .attr("flood-color", "#1f2937")
      .attr("flood-opacity", 0.5);

    const continentStroke = defs
      .append("filter")
      .attr("id", "continent-stroke-shadow")
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%");
    continentStroke
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 2)
      .attr("stdDeviation", 2)
      .attr("flood-color", "#5b4a34")
      .attr("flood-opacity", 0.35);

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#ocean-gradient)");
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#terrain-grain)")
      .attr("opacity", 0.18);

    const mapRoot = svg
      .append("g")
      .attr("class", "map-root")
      .attr("filter", "url(#map-shadow)");

    const seaLine = d3
      .line<[number, number]>()
      .curve(d3.curveCatmullRom.alpha(0.45));
    mapRoot
      .append("g")
      .attr("class", "sea-lanes")
      .selectAll("path")
      .data(seaPaths)
      .join("path")
      .attr("d", (d) => seaLine(d) ?? "")
      .attr("fill", "none")
      .attr("stroke", "#9cc4d6")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 8")
      .attr("opacity", 0.26);

    mapRoot
      .append("path")
      .attr("d", seaLine(riverPath) ?? "")
      .attr("fill", "none")
      .attr("stroke", "#86aebe")
      .attr("stroke-width", 2)
      .attr("opacity", 0.6)
      .attr("stroke-linecap", "round");

    const regionPath = d3
      .line<[number, number]>()
      .curve(d3.curveCatmullRomClosed.alpha(0.55));
    const continentPath = regionPath(continentOutline) ?? "";

    mapRoot
      .append("path")
      .attr("d", continentPath)
      .attr("fill", "url(#parchment-gradient)")
      .attr("stroke", "#5b472f")
      .attr("stroke-width", 3)
      .attr("filter", "url(#continent-stroke-shadow)");

    mapRoot
      .append("path")
      .attr("d", continentPath)
      .attr("fill", "none")
      .attr("stroke", "#f5e8c7")
      .attr("stroke-width", 1.3)
      .attr("opacity", 0.65)
      .attr("transform", "translate(1.5,1.5)");

    mapClip.append("path").attr("d", continentPath);

    const clippedMap = mapRoot
      .append("g")
      .attr("clip-path", "url(#continent-clip)");
    clippedMap
      .append("rect")
      .attr("x", 40)
      .attr("y", 60)
      .attr("width", 760)
      .attr("height", 580)
      .attr("fill", "url(#terrain-grain)")
      .attr("opacity", 0.4);

    const regionLayer = clippedMap.append("g").attr("class", "regions");
    const detailLayer = clippedMap.append("g").attr("class", "details");
    const resourceLayer = clippedMap.append("g").attr("class", "resources");
    const questLayer = clippedMap.append("g").attr("class", "quests");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.9, 2.6])
      .on("zoom", (event) => {
        mapRoot.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    const regionSelection = regionLayer
      .selectAll<SVGPathElement, Region>("path")
      .data(regions)
      .join("path")
      .attr("d", (d) => regionPath(d.points) ?? "")
      .attr("fill", (d) => factionColors[d.faction])
      .attr("fill-opacity", 0.64)
      .attr("stroke", "#3b2f22")
      .attr("stroke-width", (d) => (selectedFaction === d.faction ? 3.2 : 1.8))
      .attr("opacity", (d) => {
        if (!selectedFaction) return 1;
        return d.faction === selectedFaction ? 1 : 0.34;
      })
      .attr("filter", (d) =>
        selectedFaction && d.faction === selectedFaction
          ? "url(#region-glow)"
          : null,
      )
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        setSelectedFaction((prev) => (prev === d.faction ? null : d.faction));
      });

    regionLayer
      .selectAll<SVGPathElement, Region>("path.faction-hatching")
      .data(regions)
      .join("path")
      .attr("class", "faction-hatching")
      .attr("d", (d) => regionPath(d.points) ?? "")
      .attr("fill", "url(#faction-hatch)")
      .attr("opacity", 0.35)
      .style("pointer-events", "none");

    regionLayer
      .selectAll<SVGPathElement, Region>("path.region-outline")
      .data(regions)
      .join("path")
      .attr("class", "region-outline")
      .attr("d", (d) => regionPath(d.points) ?? "")
      .attr("fill", "none")
      .attr("stroke", "#f3e4c1")
      .attr("stroke-opacity", 0.55)
      .attr("stroke-width", 0.8)
      .attr("stroke-dasharray", "2 6")
      .style("pointer-events", "none");

    regionLayer
      .selectAll<SVGTextElement, Region>("text")
      .data(regions)
      .join("text")
      .attr("x", (d) => d.label[0])
      .attr("y", (d) => d.label[1])
      .attr("text-anchor", "middle")
      .attr("fill", "#2f2519")
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .attr("font-family", "Georgia, serif")
      .attr("letter-spacing", 0.5)
      .attr("paint-order", "stroke")
      .attr("stroke", "#f7ecd3")
      .attr("stroke-width", 3.5)
      .text((d) => d.name)
      .attr("opacity", (d) => {
        if (!selectedFaction) return 0.9;
        return d.faction === selectedFaction ? 1 : 0.45;
      });

    detailLayer
      .selectAll("path.mountain")
      .data(mountainIcons)
      .join("path")
      .attr("class", "mountain")
      .attr("d", ([x, y]) => `M ${x} ${y} l 13 -22 l 13 22 z`)
      .attr("fill", "#a28a64")
      .attr("opacity", 0.62)
      .attr("stroke", "#584630")
      .attr("stroke-width", 1);

    detailLayer
      .selectAll("path.forest")
      .data(forestClusters)
      .join("path")
      .attr("class", "forest")
      .attr("d", (cluster) => {
        const line = d3
          .line<[number, number]>()
          .curve(d3.curveCardinalClosed.tension(0.6));
        return line(cluster) ?? "";
      })
      .attr("fill", "#6f8660")
      .attr("opacity", 0.3)
      .attr("stroke", "#4a5f42")
      .attr("stroke-width", 1);

    const visibleResources = resources.filter(
      (node) =>
        activeResourceTypes.includes(node.type) &&
        (!selectedFaction ||
          regions.find((r) => r.id === node.regionId)?.faction ===
            selectedFaction),
    );

    const symbolByResourceType: Record<ResourceType, d3.SymbolType> = {
      iron: d3.symbolSquare,
      herb: d3.symbolCircle,
      relic: d3.symbolStar,
    };

    resourceLayer
      .selectAll<SVGPathElement, ResourceNode>("path")
      .data(visibleResources, (d) => d.id)
      .join("path")
      .attr("d", (d) =>
        d3
          .symbol()
          .type(symbolByResourceType[d.type])
          .size(d.type === "relic" ? 190 : 120)(),
      )
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("fill", (d) => resourceColors[d.type])
      .attr("stroke", "#3a2f24")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.95)
      .append("title")
      .text((d) => `${d.name} (${d.type})`);

    const visibleQuests = quests.filter(
      (node) =>
        activeDifficulties.includes(node.difficulty) &&
        (!selectedFaction ||
          regions.find((r) => r.id === node.regionId)?.faction ===
            selectedFaction),
    );

    const questNodes = questLayer
      .selectAll<SVGGElement, QuestNode>("g")
      .data(visibleQuests, (d) => d.id)
      .join((enter) => {
        const g = enter.append("g").attr("class", "quest-node");
        g.append("circle").attr("class", "quest-ring");
        g.append("path").attr("class", "quest-glyph");
        g.append("title");
        return g;
      });

    questNodes.attr("transform", (d) => `translate(${d.x},${d.y})`);

    questNodes
      .select<SVGCircleElement>("circle.quest-ring")
      .attr("r", 9)
      .attr("fill", (d) =>
        d.completed ? "#6ea059" : questColors[d.difficulty],
      )
      .attr("stroke", "#3a2f24")
      .attr("stroke-width", 1.8);

    questNodes
      .select<SVGPathElement>("path.quest-glyph")
      .attr("d", d3.symbol().type(d3.symbolDiamond).size(60)())
      .attr("fill", "#2f2519")
      .attr("opacity", 0.75);

    questNodes
      .select<SVGTitleElement>("title")
      .text((d) => `${d.title} (${d.difficulty})`);

    regionSelection.raise();
    resourceLayer.raise();
    questLayer.raise();

    const compass = mapRoot
      .append("g")
      .attr("class", "compass")
      .attr("transform", "translate(766,84)");
    compass
      .append("circle")
      .attr("r", 30)
      .attr("fill", "#e8d7b0")
      .attr("stroke", "#5b472f")
      .attr("stroke-width", 2);
    compass
      .append("path")
      .attr("d", "M 0 -22 L 6 0 L 0 22 L -6 0 Z")
      .attr("fill", "#5f4a31");
    compass
      .append("text")
      .attr("x", 0)
      .attr("y", -36)
      .attr("text-anchor", "middle")
      .attr("font-family", "Georgia, serif")
      .attr("font-size", 11)
      .attr("fill", "#e7d8b6")
      .text("N");

    mapRoot
      .append("text")
      .attr("x", 68)
      .attr("y", 92)
      .attr("font-family", "Georgia, serif")
      .attr("font-size", 18)
      .attr("fill", "#eadcb9")
      .attr("letter-spacing", 1)
      .text("KINGDOM OF AETHERIA");
  }, [activeDifficulties, activeResourceTypes, selectedFaction]);

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black/80 p-5">
      <div className="mb-4 flex flex-col gap-3 text-white md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Aetheria World Map Demo</h3>
          <p className="text-sm text-slate-300">
            Explore the kingdoms, toggle resources and quests, and focus a
            faction to plan your route.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedFaction(null)}
          className="self-start rounded-full border border-slate-500 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-200"
        >
          Clear faction focus
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-white">
        <span className="mr-1 self-center uppercase tracking-wide text-slate-300">
          Resources
        </span>
        {(["iron", "herb", "relic"] as ResourceType[]).map((type) => {
          const active = activeResourceTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleResourceType(type)}
              className={`rounded-full border px-3 py-1 transition ${
                active
                  ? "border-white bg-white text-black"
                  : "border-slate-500 text-slate-200 hover:border-slate-300"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-white">
        <span className="mr-1 self-center uppercase tracking-wide text-slate-300">
          Quest difficulty
        </span>
        {(["easy", "medium", "hard"] as QuestDifficulty[]).map((difficulty) => {
          const active = activeDifficulties.includes(difficulty);
          return (
            <button
              key={difficulty}
              type="button"
              onClick={() => toggleDifficulty(difficulty)}
              className={`rounded-full border px-3 py-1 transition ${
                active
                  ? "border-white bg-white text-black"
                  : "border-slate-500 text-slate-200 hover:border-slate-300"
              }`}
            >
              {difficulty}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
        <span>
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#6f8bbf]" />
          Azure Guild
        </span>
        <span>
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#be7d55]" />
          Ember Crown
        </span>
        <span>
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#7fa06a]" />
          Verdant Circle
        </span>
      </div>

      <svg ref={svgRef} className="w-full rounded-xl border border-slate-800" />
    </div>
  );
}
