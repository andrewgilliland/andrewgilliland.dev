import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type StateFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  {
    name?: string;
  }
>;

type UsaStatesGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { name?: string }
>;

type UsAtlasTopology = {
  type: "Topology";
  objects: {
    states: unknown;
  };
};

// Source: U.S. Census Bureau ACS 2023 1-year estimate (B01003_001E)
const CENSUS_2023_POPULATION_BY_STATE = new Map<string, number>([
  ["01", 5108468],
  ["02", 733406],
  ["04", 7431344],
  ["05", 3067732],
  ["06", 38965193],
  ["08", 5877610],
  ["09", 3617176],
  ["10", 1031890],
  ["11", 678972],
  ["12", 22610726],
  ["13", 11029227],
  ["15", 1435138],
  ["16", 1964726],
  ["17", 12549689],
  ["18", 6862199],
  ["19", 3207004],
  ["20", 2940546],
  ["21", 4526154],
  ["22", 4573749],
  ["23", 1395722],
  ["24", 6180253],
  ["25", 7001399],
  ["26", 10037261],
  ["27", 5737915],
  ["28", 2940057],
  ["29", 6196156],
  ["30", 1132812],
  ["31", 1972292],
  ["32", 3194176],
  ["33", 1402054],
  ["34", 9290841],
  ["35", 2113344],
  ["36", 19571216],
  ["37", 10835491],
  ["38", 783926],
  ["39", 11785935],
  ["40", 4053824],
  ["41", 4233358],
  ["42", 12961683],
  ["44", 1095962],
  ["45", 5373555],
  ["46", 919318],
  ["47", 7126489],
  ["48", 30503301],
  ["49", 3417734],
  ["50", 647464],
  ["51", 8715698],
  ["53", 7812880],
  ["54", 1770071],
  ["55", 5910955],
  ["56", 584057],
]);

const STATE_NAMES: Record<string, string> = {
  "01": "Alabama",
  "02": "Alaska",
  "04": "Arizona",
  "05": "Arkansas",
  "06": "California",
  "08": "Colorado",
  "09": "Connecticut",
  "10": "Delaware",
  "11": "District of Columbia",
  "12": "Florida",
  "13": "Georgia",
  "15": "Hawaii",
  "16": "Idaho",
  "17": "Illinois",
  "18": "Indiana",
  "19": "Iowa",
  "20": "Kansas",
  "21": "Kentucky",
  "22": "Louisiana",
  "23": "Maine",
  "24": "Maryland",
  "25": "Massachusetts",
  "26": "Michigan",
  "27": "Minnesota",
  "28": "Mississippi",
  "29": "Missouri",
  "30": "Montana",
  "31": "Nebraska",
  "32": "Nevada",
  "33": "New Hampshire",
  "34": "New Jersey",
  "35": "New Mexico",
  "36": "New York",
  "37": "North Carolina",
  "38": "North Dakota",
  "39": "Ohio",
  "40": "Oklahoma",
  "41": "Oregon",
  "42": "Pennsylvania",
  "44": "Rhode Island",
  "45": "South Carolina",
  "46": "South Dakota",
  "47": "Tennessee",
  "48": "Texas",
  "49": "Utah",
  "50": "Vermont",
  "51": "Virginia",
  "53": "Washington",
  "54": "West Virginia",
  "55": "Wisconsin",
  "56": "Wyoming",
};

export default function UsaMapDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [features, setFeatures] = useState<StateFeature[]>([]);
  const [populationByStateId, setPopulationByStateId] = useState<
    Map<string, number>
  >(new Map());
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadStates() {
      setLoading(true);
      setLoadError(null);

      const topologyResponse = await fetch(
        "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
      );

      if (!topologyResponse.ok) {
        throw new Error("Failed to load map data");
      }

      const topology = (await topologyResponse.json()) as UsAtlasTopology;
      const geo = feature(
        topology as never,
        topology.objects.states as never,
      ) as unknown;

      if (
        !geo ||
        typeof geo !== "object" ||
        (geo as { type?: string }).type !== "FeatureCollection"
      ) {
        throw new Error("Unexpected TopoJSON conversion result");
      }

      const collection = geo as UsaStatesGeoJson;

      const namedFeatures = collection.features.map((state) => {
        const id = String(state.id ?? "").padStart(2, "0");
        return {
          ...state,
          properties: {
            ...state.properties,
            name: STATE_NAMES[id] ?? `State ${id}`,
          },
        };
      }) as StateFeature[];

      if (!ignore) {
        setFeatures(namedFeatures);
        setPopulationByStateId(new Map(CENSUS_2023_POPULATION_BY_STATE));
        setLoading(false);
      }
    }

    loadStates().catch(() => {
      if (!ignore) {
        setFeatures([]);
        setPopulationByStateId(new Map());
        setLoadError("Unable to load map geometry right now.");
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (
      !svgRef.current ||
      features.length === 0 ||
      populationByStateId.size === 0
    )
      return;

    const width = 920;
    const height = 560;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const values = Array.from(populationByStateId.values());
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 100;

    const color = d3
      .scaleQuantize<string>()
      .domain([minValue, maxValue])
      .range(d3.schemeBlues[9]);

    const projection = d3.geoAlbersUsa().fitSize([width - 40, height - 64], {
      type: "FeatureCollection",
      features,
    } as GeoJSON.FeatureCollection);

    const path = d3.geoPath(projection);

    const root = svg.append("g").attr("transform", "translate(20,24)");

    root
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width - 40)
      .attr("height", height - 48)
      .attr("rx", 14)
      .attr("fill", "transparent");

    const states = root
      .append("g")
      .attr("class", "states")
      .selectAll<SVGPathElement, StateFeature>("path")
      .data(features)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", (d) => {
        const id = String(d.id ?? "").padStart(2, "0");
        const value = populationByStateId.get(id);
        return value !== undefined ? color(value) : "#94a3b8";
      })
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 0.8)
      .attr("opacity", (d) => {
        if (!selectedState) return 1;
        return d.properties?.name === selectedState ? 1 : 0.35;
      })
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        const name = d.properties?.name ?? null;
        setSelectedState((prev) => (prev === name ? null : name));
      });

    states.append("title").text((d) => {
      const name = d.properties?.name ?? "Unknown";
      const id = String(d.id ?? "").padStart(2, "0");
      const population = populationByStateId.get(id);
      return population !== undefined
        ? `${name}: ${population.toLocaleString()} residents`
        : `${name}: no Census value`;
    });

    const legendWidth = 220;
    const legendHeight = 10;
    const legendX = 18;
    const legendY = height - 32;

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX},${legendY})`);

    const bins = color.range();
    const thresholds = color.thresholds();
    const binWidth = legendWidth / bins.length;

    legend
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (_d, i) => i * binWidth)
      .attr("y", 0)
      .attr("width", binWidth + 1)
      .attr("height", legendHeight)
      .attr("fill", (d) => d);

    const tickValues = [minValue, ...thresholds, maxValue];
    const legendScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([0, legendWidth]);

    legend
      .append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(
        d3
          .axisBottom(legendScale)
          .tickValues(tickValues)
          .tickFormat((d) => d3.format("~s")(d as number)),
      )
      .selectAll("text")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 11);

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("fill", "#cbd5e1")
      .attr("font-size", 11)
      .text("Population (U.S. Census ACS 2023)");

    svg
      .append("text")
      .attr("x", 24)
      .attr("y", 24)
      .attr("fill", "#e2e8f0")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .text("USA Population Choropleth");
  }, [features, populationByStateId, selectedState]);

  return (
    <div className="not-prose my-8">
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-slate-300">
          Real Census population data by state. Click a state to focus it.
        </p>
        <button
          type="button"
          onClick={() => setSelectedState(null)}
          className="rounded-full border border-slate-500 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-200"
        >
          Clear selection
        </button>
      </div>

      {loading && (
        <p className="mb-3 text-xs text-slate-400">Loading USA map...</p>
      )}

      {loadError && <p className="mb-3 text-xs text-amber-300">{loadError}</p>}

      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
