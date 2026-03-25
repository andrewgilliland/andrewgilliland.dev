import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { chartColors } from "./colors";

const initialData = [
  { label: "React", value: 40 },
  { label: "Vue", value: 28 },
  { label: "Svelte", value: 18 },
  { label: "Angular", value: 22 },
  { label: "Astro", value: 15 },
  { label: "Solid", value: 10 },
];

export default function BarChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState(initialData);

  const shuffleData = () => {
    setData((prev) =>
      prev.map((d) => ({ ...d, value: Math.floor(Math.random() * 50) + 5 })),
    );
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)! + 5])
      .range([innerHeight, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", chartColors.axisText);

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", chartColors.axisText);

    g.selectAll("line").attr("stroke", chartColors.gridLine);
    g.selectAll("path.domain").attr("stroke", chartColors.gridLine);

    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.label)!)
      .attr("width", x.bandwidth())
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("fill", chartColors.accent)
      .attr("rx", 4)
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => innerHeight - y(d.value));

    g.selectAll(".label")
      .data(data)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.label)! + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", chartColors.axisText)
      .attr("font-size", "12px")
      .text((d) => d.value);
  }, [data]);

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Framework Popularity</h3>
        <button
          onClick={shuffleData}
          className="rounded-full bg-pink-500 px-4 py-1.5 text-sm lowercase text-white transition-all hover:shadow-[2px_2px_0_0_#fff] motion-safe:hover:-translate-x-1 motion-safe:hover:-translate-y-1"
        >
          Randomize
        </button>
      </div>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
