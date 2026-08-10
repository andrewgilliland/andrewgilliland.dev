import { useEffect, useRef, useState } from "react";

import { loadUsaPopulationMapData } from "./data";
import { renderUsaPopulationMap } from "./render";
import type { CountyFeature, StateFeature } from "./types";

export default function UsaPopulationMap() {
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

    setLoading(true);
    setLoadError(null);

    loadUsaPopulationMapData()
      .then((data) => {
        if (ignore) return;
        setStateFeatures(data.stateFeatures);
        setCountyFeatures(data.countyFeatures);
        setPopulationByCountyId(data.populationByCountyId);
        setCountyNameById(data.countyNameById);
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setStateFeatures([]);
        setCountyFeatures([]);
        setPopulationByCountyId(new Map());
        setCountyNameById(new Map());
        setLoadError(
          "Unable to load county population or map geometry right now.",
        );
        setLoading(false);
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
    ) {
      return;
    }

    renderUsaPopulationMap({
      svgElement: svgRef.current,
      stateFeatures,
      countyFeatures,
      populationByCountyId,
      countyNameById,
      selectedState,
      onStateToggle: (stateName) => {
        setSelectedState((prev) => (prev === stateName ? null : stateName));
      },
    });
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
