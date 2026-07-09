import { useEffect, useMemo, useRef, useState } from "react";
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

function valueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  }

  return 30 + (hash % 700) / 10;
}

export default function UsaMapDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [features, setFeatures] = useState<StateFeature[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadStates() {
      const response = await fetch(
        "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
      );
      const topology = (await response.json()) as UsAtlasTopology;
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
      }
    }

    loadStates().catch(() => {
      if (!ignore) {
        setFeatures([]);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const metricByName = useMemo(() => {
    const map = new Map<string, number>();

    for (const feature of features) {
      const name = feature.properties?.name ?? "Unknown";
      map.set(name, valueFromName(name));
    }

    return map;
  }, [features]);

  useEffect(() => {
    if (!svgRef.current || features.length === 0) return;

    const width = 920;
    const height = 560;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const values = Array.from(metricByName.values());
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 100;

    const color = d3
      .scaleSequential(d3.interpolateYlGnBu)
      .domain([minValue, maxValue]);

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
      .attr("fill", "#081225");

    const states = root
      .append("g")
      .attr("class", "states")
      .selectAll<SVGPathElement, StateFeature>("path")
      .data(features)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", (d) => {
        const name = d.properties?.name ?? "Unknown";
        return color(metricByName.get(name) ?? minValue);
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
      const value = metricByName.get(name) ?? minValue;
      return `${name}: ${value.toFixed(1)}`;
    });

    const legendWidth = 220;
    const legendHeight = 10;
    const legendX = 18;
    const legendY = height - 32;

    const legendScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([0, legendWidth]);

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX},${legendY})`);

    const stops = d3.range(0, 1.01, 0.1);
    const interp = d3.interpolateNumber(minValue, maxValue);

    legend
      .selectAll("rect")
      .data(stops)
      .join("rect")
      .attr("x", (d) => d * legendWidth)
      .attr("y", 0)
      .attr("width", legendWidth / stops.length + 1)
      .attr("height", legendHeight)
      .attr("fill", (d) => color(interp(d)));

    legend
      .append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(d3.axisBottom(legendScale).ticks(5))
      .selectAll("text")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 11);

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("fill", "#cbd5e1")
      .attr("font-size", 11)
      .text("Sample metric");

    svg
      .append("text")
      .attr("x", 24)
      .attr("y", 24)
      .attr("fill", "#e2e8f0")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .text("USA Choropleth Demo");
  }, [features, metricByName, selectedState]);

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black/80 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-slate-300">
          Click a state to focus it. Click again to clear the selection.
        </p>
        <button
          type="button"
          onClick={() => setSelectedState(null)}
          className="rounded-full border border-slate-500 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-200"
        >
          Clear selection
        </button>
      </div>
      <svg ref={svgRef} className="w-full rounded-xl border border-slate-800" />
    </div>
  );
}
