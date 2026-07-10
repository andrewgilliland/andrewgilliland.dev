import * as d3 from "d3";

import { STATE_NAMES, TAILWIND_PINK_9 } from "./constants";
import type { CountyFeature, StateFeature } from "./types";

type RenderUsaPopulationMapOptions = {
  svgElement: SVGSVGElement;
  stateFeatures: StateFeature[];
  countyFeatures: CountyFeature[];
  populationByCountyId: Map<string, number>;
  countyNameById: Map<string, string>;
  selectedState: string | null;
  onStateToggle: (stateName: string | null) => void;
};

export function renderUsaPopulationMap({
  svgElement,
  stateFeatures,
  countyFeatures,
  populationByCountyId,
  countyNameById,
  selectedState,
  onStateToggle,
}: RenderUsaPopulationMapOptions) {
  const width = 920;
  const height = 560;

  const svg = d3.select(svgElement);
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
      onStateToggle(name);
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
    .text("Quantile bins: each color represents a similar number of counties");

  svg
    .append("text")
    .attr("x", 24)
    .attr("y", 24)
    .attr("fill", "#e2e8f0")
    .attr("font-size", 16)
    .attr("font-weight", 700)
    .text("USA Population Choropleth");
}
