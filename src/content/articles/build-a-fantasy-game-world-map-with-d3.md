---
title: Build a Fantasy Game World Map with D3
date: 2026-07-08
excerpt: Learn how to build a playful interactive fantasy map with D3, including faction zones, resource markers, and quest filtering.
draft: false
tags: ["d3", "data-visualization", "javascript", "geojson", "svg"]
---

If you have ever wanted a project that is half data viz and half game UI, this one is a blast.

In this walkthrough, we will build an interactive fantasy world map using D3 with:

- faction zones (colored regions)
- resource markers (iron, herbs, relics)
- quest locations (with difficulty and status)
- hover tooltips, zoom/pan, and filters

## What We Are Building

Imagine a world map for an RPG dashboard:

- each region belongs to a faction (Azure Guild, Ember Crown, Verdant Circle)
- players can toggle resource types to find farming spots
- quests appear as markers and can be filtered by difficulty

This kind of map is a great portfolio piece because it combines:

- SVG rendering and coordinate systems
- data joins in D3
- interaction design
- state-driven filtering

## Project Setup

Install D3:

```bash
npm install d3
```

We will assume a plain container in your page:

```html
<div id="world-map"></div>
```

## Data Model

Use GeoJSON for regions and a normal array for map points.

```ts
type Faction = "azure" | "ember" | "verdant";
type ResourceType = "iron" | "herb" | "relic";
type QuestDifficulty = "easy" | "medium" | "hard";

type RegionFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  {
    id: string;
    name: string;
    faction: Faction;
  }
>;

type ResourceNode = {
  id: string;
  name: string;
  type: ResourceType;
  coords: [number, number]; // [lng, lat]
};

type QuestNode = {
  id: string;
  title: string;
  difficulty: QuestDifficulty;
  coords: [number, number];
  completed: boolean;
};
```

A tiny example of resource and quest data:

```ts
const resources: ResourceNode[] = [
  { id: "r1", name: "Iron Vein", type: "iron", coords: [24, 36] },
  { id: "r2", name: "Moonleaf Grove", type: "herb", coords: [42, 28] },
  { id: "r3", name: "Sunken Relic", type: "relic", coords: [61, 52] },
];

const quests: QuestNode[] = [
  {
    id: "q1",
    title: "Bandits at Frostpass",
    difficulty: "easy",
    coords: [31, 40],
    completed: false,
  },
  {
    id: "q2",
    title: "The Ember Vault",
    difficulty: "hard",
    coords: [56, 47],
    completed: false,
  },
  {
    id: "q3",
    title: "Herbal Remedy Run",
    difficulty: "medium",
    coords: [44, 30],
    completed: true,
  },
];
```

## Render the Base Map

Create an SVG, map group, and projection.

```ts
import * as d3 from "d3";

const width = 980;
const height = 620;

const svg = d3
  .select("#world-map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("width", "100%")
  .attr("height", "auto")
  .style("background", "#0f1320");

const g = svg.append("g").attr("class", "map-root");

const projection = d3.geoMercator().fitSize([width, height], worldGeoJson);
const path = d3.geoPath(projection);
```

Now draw faction regions:

```ts
const factionColor: Record<Faction, string> = {
  azure: "#4f7cff",
  ember: "#f06a3f",
  verdant: "#50b271",
};

g.append("g")
  .attr("class", "regions")
  .selectAll("path")
  .data(worldGeoJson.features as RegionFeature[])
  .join("path")
  .attr("d", (d) => path(d) ?? "")
  .attr("fill", (d) => factionColor[d.properties.faction])
  .attr("stroke", "#111827")
  .attr("stroke-width", 1.25)
  .attr("opacity", 0.85);
```

## Add Zoom and Pan

```ts
const zoom = d3
  .zoom<SVGSVGElement, unknown>()
  .scaleExtent([1, 7])
  .on("zoom", (event) => {
    g.attr("transform", event.transform.toString());
  });

svg.call(zoom);
```

## Draw Resource Markers

Convert coords to screen points using the projection.

```ts
const resourceLayer = g.append("g").attr("class", "resources");

resourceLayer
  .selectAll("circle")
  .data(resources)
  .join("circle")
  .attr("cx", (d) => projection(d.coords)?.[0] ?? -999)
  .attr("cy", (d) => projection(d.coords)?.[1] ?? -999)
  .attr("r", 5)
  .attr("fill", (d) => {
    if (d.type === "iron") return "#9ca3af";
    if (d.type === "herb") return "#34d399";
    return "#fbbf24";
  })
  .attr("stroke", "#0b1020")
  .attr("stroke-width", 1.5);
```

## Draw Quest Markers

Use a symbol so quests are visually distinct.

```ts
const questLayer = g.append("g").attr("class", "quests");

const symbol = d3.symbol().type(d3.symbolDiamond).size(80);

questLayer
  .selectAll("path")
  .data(quests)
  .join("path")
  .attr("d", symbol)
  .attr("transform", (d) => {
    const [x, y] = projection(d.coords) ?? [-999, -999];
    return `translate(${x},${y})`;
  })
  .attr("fill", (d) => (d.completed ? "#22c55e" : "#f59e0b"))
  .attr("stroke", "#111827")
  .attr("stroke-width", 1.5);
```

## Tooltips and Hover States

```ts
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "map-tooltip")
  .style("position", "fixed")
  .style("pointer-events", "none")
  .style("background", "#0b1020")
  .style("border", "1px solid #334155")
  .style("color", "#e2e8f0")
  .style("padding", "8px 10px")
  .style("border-radius", "8px")
  .style("opacity", "0");

function showTooltip(html: string, event: MouseEvent) {
  tooltip
    .html(html)
    .style("left", `${event.clientX + 12}px`)
    .style("top", `${event.clientY + 12}px`)
    .transition()
    .duration(120)
    .style("opacity", "1");
}

function hideTooltip() {
  tooltip.transition().duration(120).style("opacity", "0");
}
```

Attach it to resources and quests:

```ts
resourceLayer
  .selectAll<SVGCircleElement, ResourceNode>("circle")
  .on("mousemove", (event, d) => {
    showTooltip(
      `<strong>${d.name}</strong><br/>Resource: ${d.type}`,
      event as MouseEvent,
    );
  })
  .on("mouseleave", hideTooltip);

questLayer
  .selectAll<SVGPathElement, QuestNode>("path")
  .on("mousemove", (event, d) => {
    showTooltip(
      `<strong>${d.title}</strong><br/>Difficulty: ${d.difficulty}`,
      event as MouseEvent,
    );
  })
  .on("mouseleave", hideTooltip);
```

## Add Filters (Resources and Quest Difficulty)

Use app state and redraw visibility only.

```ts
const state = {
  activeResourceTypes: new Set<ResourceType>(["iron", "herb", "relic"]),
  activeDifficulty: new Set<QuestDifficulty>(["easy", "medium", "hard"]),
};

function updateFilters() {
  resourceLayer
    .selectAll<SVGCircleElement, ResourceNode>("circle")
    .attr("display", (d) =>
      state.activeResourceTypes.has(d.type) ? null : "none",
    );

  questLayer
    .selectAll<SVGPathElement, QuestNode>("path")
    .attr("display", (d) =>
      state.activeDifficulty.has(d.difficulty) ? null : "none",
    );
}
```

Hook that up to checkboxes and call `updateFilters()` when they change.

## Make Faction Zones Feel Alive

A few tiny visual upgrades make this feel game-like:

- add a soft glow when hovering a region
- thicken region border on selection
- fade non-selected factions to draw focus

```ts
const regions = g
  .select(".regions")
  .selectAll<SVGPathElement, RegionFeature>("path");

regions
  .on("mouseenter", function () {
    d3.select(this).transition().duration(120).attr("opacity", 1);
  })
  .on("mouseleave", function () {
    d3.select(this).transition().duration(120).attr("opacity", 0.85);
  })
  .on("click", (_event, d) => {
    regions.attr("opacity", (r) =>
      r.properties.faction === d.properties.faction ? 1 : 0.25,
    );
  });
```

## Keep It Fast

As your map grows, keep interactions smooth:

- render large point sets in Canvas, keep regions in SVG
- avoid full re-renders on every filter change
- debounce expensive UI updates
- precompute projected coordinates for static points

## Final Ideas to Extend This

- add a timeline slider for faction control over time
- cluster quest markers by region at low zoom levels
- add route animation for "active quest path"
- persist selected filters in URL params

## Wrap Up

This project is a perfect D3 playground because it combines storytelling and data interaction in one UI.

You now have a reusable pattern for any map-based visualization:

- polygon regions for context
- point layers for entities
- filter state for interaction
- D3 zoom + tooltips for exploration

If you build this, add your own lore and make the dataset weird. The more personality in the data, the more memorable the visualization.
