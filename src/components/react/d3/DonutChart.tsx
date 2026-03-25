import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { chartColors } from "./colors";

const data = [
  { label: "JavaScript", value: 35, color: "#f7df1e" },
  { label: "TypeScript", value: 30, color: "#3178c6" },
  { label: "Python", value: 15, color: "#3776ab" },
  { label: "Go", value: 10, color: "#00add8" },
  { label: "Rust", value: 10, color: "#dea584" },
];

export default function DonutChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const size = 300;
    const radius = size / 2;
    const innerRadius = radius * 0.55;

    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${size} ${size}`)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const pie = d3
      .pie<(typeof data)[0]>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02);

    const arc = d3
      .arc<d3.PieArcDatum<(typeof data)[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 10);

    const arcHover = d3
      .arc<d3.PieArcDatum<(typeof data)[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const arcs = g
      .selectAll("path")
      .data(pie(data))
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", chartColors.background)
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (_event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover(d) as string);
        setActiveSlice(d.data.label);
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc(d) as string);
        setActiveSlice(null);
      });

    arcs
      .transition()
      .duration(800)
      .attrTween("d", function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(i(t) as d3.PieArcDatum<(typeof data)[0]>) ?? "";
      });
  }, []);

  const active = data.find((d) => d.label === activeSlice);

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black p-6">
      <h3 className="mb-4 text-lg font-medium text-white">Languages Used</h3>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative w-full max-w-[250px]">
          <svg ref={svgRef} className="w-full" />
          {active && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {active.value}%
              </span>
              <span className="text-sm text-gray-400">{active.label}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span
                className={`text-sm ${activeSlice === d.label ? "text-white" : "text-gray-400"}`}
              >
                {d.label}: {d.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
