import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { chartColors } from "./colors";

const generateData = () =>
  Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2026, i, 1),
    value: Math.floor(Math.random() * 80) + 20,
  }));

export default function LineChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState(generateData);
  const [tooltip, setTooltip] = useState<{
    month: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 280;
    const margin = { top: 20, right: 20, bottom: 40, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.month) as [Date, Date])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)! + 10])
      .range([innerHeight, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat(
            d3.timeFormat("%b") as unknown as (
              d: Date | d3.NumberValue,
            ) => string,
          ),
      )
      .selectAll("text")
      .attr("fill", chartColors.axisText);

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", chartColors.axisText);

    g.selectAll("line").attr("stroke", chartColors.gridLine);
    g.selectAll("path.domain").attr("stroke", chartColors.gridLine);

    const area = d3
      .area<(typeof data)[0]>()
      .x((d) => x(d.month))
      .y0(innerHeight)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", chartColors.accentAlpha)
      .attr("d", area);

    const line = d3
      .line<(typeof data)[0]>()
      .x((d) => x(d.month))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", chartColors.accent)
      .attr("stroke-width", 2.5)
      .attr("d", line);

    const totalLength = path.node()!.getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.month))
      .attr("cy", (d) => y(d.value))
      .attr("r", 4)
      .attr("fill", chartColors.accent)
      .attr("stroke", chartColors.background)
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (_event, d) {
        d3.select(this).transition().duration(150).attr("r", 7);
        const svgRect = svgRef.current!.getBoundingClientRect();
        setTooltip({
          month: d3.timeFormat("%B")(d.month),
          value: d.value,
          x: ((x(d.month) + margin.left) / width) * svgRect.width,
          y: ((y(d.value) + margin.top) / height) * svgRect.height,
        });
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(150).attr("r", 4);
        setTooltip(null);
      });
  }, [data]);

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Monthly Activity</h3>
        <button
          onClick={() => setData(generateData())}
          className="rounded-full bg-pink-500 px-4 py-1.5 text-sm lowercase text-white transition-all hover:shadow-[2px_2px_0_0_#fff] motion-safe:hover:-translate-x-1 motion-safe:hover:-translate-y-1"
        >
          New Data
        </button>
      </div>
      <div className="relative">
        <svg ref={svgRef} className="w-full" />
        {tooltip && (
          <div
            className="pointer-events-none absolute rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y - 40 }}
          >
            {tooltip.month}: <span className="font-bold">{tooltip.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
