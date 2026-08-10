import { feature } from "topojson-client";

import { COUNTY_POPULATION_ENDPOINT, STATE_NAMES } from "./constants";
import type {
  CountyFeature,
  CountyPopulationApiResponse,
  StateFeature,
  UsAtlasTopology,
  UsaStatesGeoJson,
} from "./types";

export async function loadUsaPopulationMapData() {
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

  const stateFeatures = stateCollection.features.map((state) => {
    const id = String(state.id ?? "").padStart(2, "0");
    return {
      ...state,
      properties: {
        ...state.properties,
        name: STATE_NAMES[id] ?? `State ${id}`,
      },
    };
  }) as StateFeature[];

  const countyFeatures = countyCollection.features.map((county) => {
    const countyId = String(county.id ?? "").padStart(5, "0");
    const stateId = countyId.slice(0, 2);
    return {
      ...county,
      properties: {
        stateId,
      },
    };
  }) as CountyFeature[];

  return {
    stateFeatures,
    countyFeatures,
    populationByCountyId: countyPopulation.populationMap,
    countyNameById: countyPopulation.countyNameMap,
  };
}

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
