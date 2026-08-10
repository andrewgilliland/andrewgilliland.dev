export type StateFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  {
    name?: string;
  }
>;

export type CountyFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  {
    stateId: string;
  }
>;

export type UsaStatesGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { name?: string }
>;

export type UsAtlasTopology = {
  type: "Topology";
  objects: {
    states: unknown;
    counties: unknown;
  };
};

export type CountyPopulationApiResponse = {
  counties: Record<
    string,
    {
      name: string;
      population: number;
      stateId: string;
    }
  >;
};
