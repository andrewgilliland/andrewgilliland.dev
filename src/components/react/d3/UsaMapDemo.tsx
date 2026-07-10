import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type StateFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  {
    name?: string;
  }
>;

type CountyFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  {
    stateId: string;
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
    counties: unknown;
  };
};

const COUNTY_POPULATION_ENDPOINT = "/api/county-population.json";

type CountyPopulationApiResponse = {
  counties: Record<
    string,
    {
      name: string;
      population: number;
      stateId: string;
    }
  >;
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

const TAILWIND_PINK_9 = [
  "#fce7f3",
  "#fbcfe8",
  "#f9a8d4",
  "#f472b6",
  "#ec4899",
  "#db2777",
  "#be185d",
  "#9d174d",
  "#831843",
];

export default function UsaMapDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [stateFeatures, setStateFeatures] = useState<StateFeature[]>([]);
  const [countyFeatures, setCountyFeatures] = useState<CountyFeature[]>([]);
  const [populationByCountyId, setPopulationByCountyId] = useState<
    Map<string, number>
  >(new Map());
  const [countyNameById, setCountyNameById] = useState<Map<string, string>>(
    new Map(),
  );
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadCountyPopulation() {
      const response = await fetch(COUNTY_POPULATION_ENDPOINT);

      if (!response.ok) {
        throw new Error("Failed to load county population data");
      }

      const payload = (await response.json()) as CountyPopulationApiResponse;
      const countyRecords = payload?.counties;

      if (!countyRecords || typeof countyRecords !== "object") {
        throw new Error("Unexpected county population response");
      }

      const populationMap = new Map<string, number>();
      const countyNameMap = new Map<string, string>();

      Object.entries(countyRecords).forEach(([countyId, county]) => {
        if (
          !county ||
          !county.name ||
          !Number.isFinite(county.population) ||
          county.population <= 0
        ) {
          return;
        }

        populationMap.set(countyId, county.population);
        countyNameMap.set(countyId, county.name);
      });

      if (populationMap.size === 0) {
        throw new Error("No county population values were loaded");
      }

      return { populationMap, countyNameMap };
    }

    async function loadStatesAndCounties() {
      setLoading(true);
      setLoadError(null);

      const [topologyResponse, countyPopulation] = await Promise.all([
        fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
        loadCountyPopulation(),
      ]);

      if (!topologyResponse.ok) {
        throw new Error("Failed to load map data");
      }

      const topology = (await topologyResponse.json()) as UsAtlasTopology;
      const statesGeo = feature(
        topology as never,
        topology.objects.states as never,
      ) as unknown;
      const countiesGeo = feature(
        topology as never,
        topology.objects.counties as never,
      ) as unknown;

      if (
        !statesGeo ||
        typeof statesGeo !== "object" ||
        (statesGeo as { type?: string }).type !== "FeatureCollection"
      ) {
        throw new Error("Unexpected states TopoJSON conversion result");
      }

      if (
        !countiesGeo ||
        typeof countiesGeo !== "object" ||
        (countiesGeo as { type?: string }).type !== "FeatureCollection"
      ) {
        throw new Error("Unexpected counties TopoJSON conversion result");
      }

      const stateCollection = statesGeo as UsaStatesGeoJson;
      const countyCollection = countiesGeo as GeoJSON.FeatureCollection<
        GeoJSON.Polygon | GeoJSON.MultiPolygon,
        Record<string, unknown>
      >;

      const namedStateFeatures = stateCollection.features.map((state) => {
        const id = String(state.id ?? "").padStart(2, "0");
        return {
          ...state,
          properties: {
            ...state.properties,
            name: STATE_NAMES[id] ?? `State ${id}`,
          },
        };
      }) as StateFeature[];

      const normalizedCountyFeatures = countyCollection.features.map(
        (county) => {
          const countyId = String(county.id ?? "").padStart(5, "0");
          const stateId = countyId.slice(0, 2);
          return {
            ...county,
            properties: {
              stateId,
            },
          };
        },
      ) as CountyFeature[];

      if (!ignore) {
        setStateFeatures(namedStateFeatures);
        setCountyFeatures(normalizedCountyFeatures);
        setPopulationByCountyId(countyPopulation.populationMap);
        setCountyNameById(countyPopulation.countyNameMap);
        setLoading(false);
      }
    }

    loadStatesAndCounties().catch(() => {
      if (!ignore) {
        setStateFeatures([]);
        setCountyFeatures([]);
        setPopulationByCountyId(new Map());
        setCountyNameById(new Map());
        setLoadError(
          "Unable to load county population or map geometry right now.",
        );
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
      stateFeatures.length === 0 ||
      countyFeatures.length === 0 ||
      populationByCountyId.size === 0
    )
      return;

    const width = 920;
    const height = 560;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const values = Array.from(populationByCountyId.values());
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 100;

    const color = d3
      .scaleQuantile<string>()
      .domain(values)
      .range(TAILWIND_PINK_9);

    const projection = d3.geoAlbersUsa().fitSize([width - 40, height - 64], {
      type: "FeatureCollection",
      features: stateFeatures,
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

    const counties = root
      .append("g")
      .attr("class", "counties")
      .selectAll<SVGPathElement, CountyFeature>("path")
      .data(countyFeatures)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", (d) => {
        const countyId = String(d.id ?? "").padStart(5, "0");
        const value = populationByCountyId.get(countyId);
        return value !== undefined ? color(value) : "#94a3b8";
      })
      .attr("stroke", "none")
      .attr("opacity", (d) => {
        if (!selectedState) return 1;
        const name = STATE_NAMES[d.properties.stateId];
        return name === selectedState ? 1 : 0.2;
      })
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        const name = STATE_NAMES[d.properties.stateId] ?? null;
        setSelectedState((prev) => (prev === name ? null : name));
      });

    counties.append("title").text((d) => {
      const countyId = String(d.id ?? "").padStart(5, "0");
      const countyName = countyNameById.get(countyId) ?? `County ${countyId}`;
      const population = populationByCountyId.get(countyId);
      return population !== undefined
        ? `${countyName}: ${population.toLocaleString()} residents`
        : `${countyName}: no Census value`;
    });

    root
      .append("g")
      .attr("class", "state-borders")
      .selectAll<SVGPathElement, StateFeature>("path")
      .data(stateFeatures)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", "none")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 0.8)
      .attr("pointer-events", "none")
      .attr("opacity", (d) => {
        if (!selectedState) return 0.9;
        return d.properties?.name === selectedState ? 1 : 0.4;
      });

    const legendWidth = 220;
    const legendHeight = 10;
    const legendX = 18;
    const legendY = height - 32;

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX},${legendY})`);

    const bins = color.range().map((shade) => {
      const [start, end] = color.invertExtent(shade);
      return {
        shade,
        start: start ?? minValue,
        end: end ?? maxValue,
      };
    });
    const binWidth = legendWidth / bins.length;

    legend
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (_d, i) => i * binWidth)
      .attr("y", 0)
      .attr("width", binWidth + 1)
      .attr("height", legendHeight)
      .attr("fill", (d) => d.shade);

    const boundaries = [
      bins[0]?.start ?? minValue,
      ...bins.map((bin) => bin.end),
    ];
    const boundaryPositions = Array.from(
      new Set([
        0,
        Math.floor((boundaries.length - 1) / 3),
        Math.floor(((boundaries.length - 1) * 2) / 3),
        boundaries.length - 1,
      ]),
    );

    const labelScale = d3
      .scaleLinear()
      .domain([0, boundaries.length - 1])
      .range([0, legendWidth]);

    legend
      .append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .selectAll("text")
      .data(boundaryPositions)
      .join("text")
      .attr("x", (d) => labelScale(d))
      .attr("y", 14)
      .attr("text-anchor", (d) => {
        if (d === 0) return "start";
        if (d === boundaries.length - 1) return "end";
        return "middle";
      })
      .attr("fill", "#cbd5e1")
      .attr("font-size", 11)
      .text((d) => d3.format("~s")(boundaries[d] ?? 0));

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("fill", "#cbd5e1")
      .attr("font-size", 11)
      .text("County population (U.S. Census ACS 2023)");

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 28)
      .attr("fill", "#94a3b8")
      .attr("font-size", 10)
      .text(
        "Quantile bins: each color represents a similar number of counties",
      );

    svg
      .append("text")
      .attr("x", 24)
      .attr("y", 24)
      .attr("fill", "#e2e8f0")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .text("USA Population Choropleth");
  }, [
    countyFeatures,
    countyNameById,
    stateFeatures,
    populationByCountyId,
    selectedState,
  ]);

  return (
    <div className="not-prose my-8">
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-slate-300">
          Real Census county-level population across the USA. Click a county to
          focus its state.
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
