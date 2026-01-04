import { FC, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { pink300 } from "@/styles/colors";
import us from "@/lib/data/us.json";
import illinois from "@/lib/data/illinois-counties.json";

type MapProps = {
  width: number;
  height: number;
};

type CreateMapParams = {
  width: number;
  height: number;
};

// D3 Types

type Coordinates = [number, number];

type GeometryType = "Polygon" | "MultiPolygon";

type Geomtry = {
  type: GeometryType;
  coordinates: Coordinates[][];
};

type Feature = {
  type: "Feature";
  geometry: Geomtry;
  properties: {
    name: string;
  };
};

type GeoJSON = {
  type: "FeatureCollection";
  features: Feature[];
};

// https://observablehq.com/@d3/zoom-to-bounding-box?intent=fork

const Map: FC<MapProps> = ({ width, height }) => {
  // const ref = useRef();

  // const createIllinoisMap = ({ width, height }: CreateMapParams) => {
  //   const marginX = 20;
  //   const marginY = 20;

  //   const bloomington = {
  //     name: "Bloomington",
  //     coordinates: [-88.9937, 40.4842] as Coordinates,
  //   };

  //   const projection = d3.geoMercator().fitExtent(
  //     [
  //       [marginX, marginY],
  //       [width - marginX, height - marginY],
  //     ],
  //     illinois
  //   );

  //   const pathGenerator = d3.geoPath().projection(projection);
  //   const svg = d3.select(ref.current);

  //   svg
  //     .append("path")
  //     .datum(illinois)
  //     .attr("title", "Illinois")
  //     .attr("d", pathGenerator)
  //     .attr("fill", "none")
  //     .attr("stroke", "#FFF")
  //     .attr("stroke-width", 1)
  //     .attr("width", width)
  //     .attr("height", height);

  //   svg
  //     .append("circle")
  //     .attr("cx", projection(bloomington.coordinates)[0])
  //     .attr("cy", projection(bloomington.coordinates)[1])
  //     .attr("r", 5)
  //     .attr("fill", pink300);

  //   // svg
  //   //   .append("text")
  //   //   .text(bloomington.name)
  //   //   .attr("fill", "#FFF")
  //   //   .attr("x", projection(bloomington.coordinates)[0])
  //   //   .attr("y", projection(bloomington.coordinates)[1]);
  // };

  // const createUsaMap = ({ width, height }: CreateMapParams) => {
  //   const path = d3.geoPath();
  //   const data = us;

  //   const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

  //   const svg = d3
  //     .select(ref.current)
  //     .attr("viewBox", [0, 0, 960, 600])
  //     .attr("width", width)
  //     .attr("height", height)
  //     .attr("style", "max-width: 100%; height: auto;");
  //   //   .on("click", reset);

  //   const g = svg.append("g");

  //   // const states = g
  //   g.append("g")
  //     .attr("fill", "#333")
  //     .attr("cursor", "pointer")
  //     .selectAll("path")
  //     .data(topojson.feature(data, data.objects.states).features)
  //     .join("path")
  //     //   .on("click", clicked)
  //     .attr("d", path);

  //   g.append("path")
  //     .attr("fill", "none")
  //     .attr("stroke", pink300)
  //     .attr("stroke-linejoin", "round")
  //     .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

  //   svg.call(zoom);

  //   function zoomed(event) {
  //     const { transform } = event;
  //     g.attr("transform", transform);
  //     g.attr("stroke-width", 1 / transform.k);
  //   }

  //   // function reset() {
  //   //   states.transition().style("fill", null);
  //   //   svg
  //   //     .transition()
  //   //     .duration(750)
  //   //     .call(
  //   //       zoom.transform,
  //   //       d3.zoomIdentity,
  //   //       d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
  //   //     );
  //   // }

  //   // function clicked(event, d) {
  //   //   const [[x0, y0], [x1, y1]] = path.bounds(d);
  //   //   event.stopPropagation();
  //   //   states.transition().style("fill", null);
  //   //   d3.select(this).transition().style("fill", pink300);
  //   //   svg
  //   //     .transition()
  //   //     .duration(750)
  //   //     .call(
  //   //       zoom.transform,
  //   //       d3.zoomIdentity
  //   //         .translate(width / 2, height / 2)
  //   //         .scale(
  //   //           Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
  //   //         )
  //   //         .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
  //   //       d3.pointer(event, svg.node())
  //   //     );
  //   // }

  //   return svg.node();
  // };

  // useEffect(() => {
  //   createIllinoisMap({ width, height });
  //   // createUsaMap({ width, height });
  // }, [width, height]);

  return (
    // <svg
    //   className="border rounded max-w-full h-auto"
    //   width={width}
    //   height={height}
    //   id="map"
    //   ref={ref}
    // />
    <svg></svg>
  );
};

export default Map;

export const ClientMap = dynamic(() => import("../d3/Map"), {
  ssr: false,
});
