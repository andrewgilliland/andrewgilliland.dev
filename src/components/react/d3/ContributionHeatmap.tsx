import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { chartColors } from "./colors";

type Day = {
  date: Date;
  count: number;
};

function generateYear(): Day[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setFullYear(today.getFullYear() - 1);
  start.setDate(start.getDate() + 1);

  const days: Day[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const rand = Math.random();
    const count =
      rand < 0.35
        ? 0
        : rand < 0.6
          ? Math.floor(Math.random() * 3) + 1
          : rand < 0.8
            ? Math.floor(Math.random() * 4) + 4
            : rand < 0.95
              ? Math.floor(Math.random() * 5) + 8
              : Math.floor(Math.random() * 6) + 13;
    days.push({ date: new Date(cursor), count });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;

export default function ContributionHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<Day[]>(generateYear);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const color = d3
      .scaleThreshold<number, string>()
      .domain([1, 4, 8, 13])
      .range(["#1f2937", "#831843", "#be185d", "#db2777", chartColors.accent]);

    const firstDay = data[0].date;
    const startDow = firstDay.getDay();

    const weeks: (Day | null)[][] = [];
    let week: (Day | null)[] = Array(startDow).fill(null);
    for (const day of data) {
      week.push(day);
      if (day.date.getDay() === 6) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) weeks.push(week);

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labelWidth = 28;
    const svgWidth = labelWidth + weeks.length * STEP;
    const svgHeight = 7 * STEP + 20;

    svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`).attr("width", "100%");

    // Month labels
    const monthGroup = svg
      .append("g")
      .attr("transform", `translate(${labelWidth}, 0)`);
    let lastMonth = -1;
    weeks.forEach((w, wi) => {
      const firstReal = w.find(Boolean);
      if (!firstReal) return;
      const m = firstReal.date.getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        monthGroup
          .append("text")
          .attr("x", wi * STEP)
          .attr("y", 10)
          .attr("fill", chartColors.axisText)
          .attr("font-size", 10)
          .text(d3.timeFormat("%b")(firstReal.date));
      }
    });

    // Day-of-week labels
    const dowGroup = svg.append("g").attr("transform", `translate(0, 20)`);
    [1, 3, 5].forEach((dow) => {
      dowGroup
        .append("text")
        .attr("x", 0)
        .attr("y", dow * STEP + CELL)
        .attr("fill", chartColors.axisText)
        .attr("font-size", 9)
        .attr("text-anchor", "start")
        .text(dayLabels[dow]);
    });

    // Cells
    const cellGroup = svg
      .append("g")
      .attr("transform", `translate(${labelWidth}, 20)`);

    weeks.forEach((w, wi) => {
      w.forEach((day, di) => {
        if (!day) return;
        const rect = cellGroup
          .append("rect")
          .attr("x", wi * STEP)
          .attr("y", di * STEP)
          .attr("width", CELL)
          .attr("height", CELL)
          .attr("rx", 2)
          .attr("fill", color(day.count))
          .style("cursor", "pointer")
          .on("mouseenter", function () {
            d3.select(this).attr("stroke", "white").attr("stroke-width", 1.5);
            const svgRect = svgRef.current!.getBoundingClientRect();
            const vb = svgRef.current!.getAttribute("viewBox")!.split(" ");
            const scaleX = svgRect.width / parseFloat(vb[2]);
            const scaleY = svgRect.height / parseFloat(vb[3]);
            setTooltip({
              text: `${day.count} contribution${day.count !== 1 ? "s" : ""} on ${d3.timeFormat("%b %d, %Y")(day.date)}`,
              x: (wi * STEP + labelWidth) * scaleX,
              y: (di * STEP + 20) * scaleY,
            });
          })
          .on("mouseleave", function () {
            d3.select(this).attr("stroke", null);
            setTooltip(null);
          });

        rect
          .attr("opacity", 0)
          .transition()
          .delay(wi * 8)
          .duration(300)
          .attr("opacity", 1);
      });
    });

    // Legend
    const legendData = [0, 1, 4, 8, 13];
    const legendGroup = svg
      .append("g")
      .attr(
        "transform",
        `translate(${svgWidth - legendData.length * STEP - 40}, ${svgHeight - 14})`,
      );
    legendGroup
      .append("text")
      .attr("x", -4)
      .attr("y", CELL)
      .attr("fill", chartColors.axisText)
      .attr("font-size", 9)
      .attr("text-anchor", "end")
      .text("Less");
    legendData.forEach((val, i) => {
      legendGroup
        .append("rect")
        .attr("x", i * STEP)
        .attr("y", 0)
        .attr("width", CELL)
        .attr("height", CELL)
        .attr("rx", 2)
        .attr("fill", color(val));
    });
    legendGroup
      .append("text")
      .attr("x", legendData.length * STEP + 4)
      .attr("y", CELL)
      .attr("fill", chartColors.axisText)
      .attr("font-size", 9)
      .text("More");
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">
            Contribution Activity
          </h3>
          <p className="text-sm text-gray-400">
            {total.toLocaleString()} contributions in the last year
          </p>
        </div>
        <button
          onClick={() => setData(generateYear())}
          className="rounded-full bg-pink-500 px-4 py-1.5 text-sm lowercase text-white transition-all hover:shadow-[2px_2px_0_0_#fff] motion-safe:hover:-translate-x-1 motion-safe:hover:-translate-y-1"
        >
          Regenerate
        </button>
      </div>
      <div className="relative overflow-x-auto">
        <svg ref={svgRef} />
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white shadow-lg"
            style={{ left: tooltip.x + 6, top: tooltip.y - 36 }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}
