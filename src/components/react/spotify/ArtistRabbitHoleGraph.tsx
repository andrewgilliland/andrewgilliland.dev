import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import {
  fetchArtistGraph,
  type ArtistGraphEdge,
  type ArtistGraphNode,
  type ArtistGraphPayload,
} from "./api";

interface GraphNodePosition extends ArtistGraphNode {
  x: number;
  y: number;
}

interface ArtistRabbitHoleGraphProps {
  initialArtistId: string;
  title?: string;
  depth?: number;
  limitPerNode?: number;
  maxNodes?: number;
  compact?: boolean;
  showExplorerLink?: boolean;
  className?: string;
}

const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 520;

function clampText(value: string, max = 16): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

function timeAgo(isoTime: string): string {
  const deltaSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(isoTime).getTime()) / 1000),
  );

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  return `${Math.round(deltaSeconds / 60)}m ago`;
}

export default function ArtistRabbitHoleGraph({
  initialArtistId,
  title = "Artist Rabbit Holes",
  depth = 2,
  limitPerNode = 6,
  maxNodes,
  compact = false,
  showExplorerLink = true,
  className,
}: ArtistRabbitHoleGraphProps) {
  const [rootArtistId, setRootArtistId] = useState(initialArtistId);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [payload, setPayload] = useState<ArtistGraphPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    async function load() {
      setIsLoading(true);
      try {
        const next = await fetchArtistGraph(rootArtistId, depth, limitPerNode);
        if (isDisposed) {
          return;
        }
        setPayload(next);
        setSelectedArtistId(next.rootArtistId);
        setError(null);
      } catch {
        if (isDisposed) {
          return;
        }
        setError("Could not load artist graph right now.");
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isDisposed = true;
    };
  }, [rootArtistId, depth, limitPerNode]);

  const graphData = useMemo(() => {
    if (!payload) {
      return { nodes: [] as ArtistGraphNode[], edges: [] as ArtistGraphEdge[] };
    }

    if (!maxNodes || payload.nodes.length <= maxNodes) {
      return { nodes: payload.nodes, edges: payload.edges };
    }

    const selectedNodes = payload.nodes.slice(0, maxNodes);
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    const selectedEdges = payload.edges.filter(
      (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
    );

    return { nodes: selectedNodes, edges: selectedEdges };
  }, [payload, maxNodes]);

  const layout = useMemo(() => {
    const width = compact ? 780 : DEFAULT_WIDTH;
    const height = compact ? 360 : DEFAULT_HEIGHT;

    if (!graphData.nodes.length) {
      return {
        width,
        height,
        nodes: [] as GraphNodePosition[],
        edges: [] as ArtistGraphEdge[],
      };
    }

    const nodes = graphData.nodes.map((node) => ({
      ...node,
      x: width / 2,
      y: height / 2,
    }));

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const links = graphData.edges
      .map((edge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (!source || !target) {
          return null;
        }
        return { source, target };
      })
      .filter(
        (
          link,
        ): link is { source: GraphNodePosition; target: GraphNodePosition } =>
          Boolean(link),
      );

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "charge",
        d3.forceManyBody<GraphNodePosition>().strength(compact ? -90 : -160),
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "link",
        d3
          .forceLink(links)
          .distance(compact ? 70 : 96)
          .strength(0.65),
      )
      .force("collision", d3.forceCollide<GraphNodePosition>(compact ? 20 : 28))
      .stop();

    for (let i = 0; i < 160; i += 1) {
      simulation.tick();
    }

    simulation.stop();

    return {
      width,
      height,
      nodes,
      edges: graphData.edges,
    };
  }, [compact, graphData.edges, graphData.nodes]);

  const selected =
    payload?.nodes.find((node) => node.id === selectedArtistId) ?? null;

  return (
    <section className={className} aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl text-white md:text-2xl">{title}</h3>
        {showExplorerLink ? (
          <a
            href="/listening"
            className="text-sm text-cyan-300 underline-offset-4 hover:underline"
          >
            Open Full Explorer
          </a>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/20 bg-zinc-950/70 p-4 md:p-5">
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading connected artists...</p>
        ) : null}

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {!isLoading && !error && payload ? (
          <>
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="h-[360px] w-full rounded-lg border border-zinc-800 bg-black/50 md:h-[420px]"
              role="img"
              aria-label="Interactive related artists graph"
            >
              {layout.edges.map((edge) => {
                const source = layout.nodes.find(
                  (node) => node.id === edge.source,
                );
                const target = layout.nodes.find(
                  (node) => node.id === edge.target,
                );
                if (!source || !target) {
                  return null;
                }

                return (
                  <line
                    key={`${edge.source}-${edge.target}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="rgba(103,232,249,0.35)"
                    strokeWidth={1.5}
                  />
                );
              })}

              {layout.nodes.map((node) => {
                const isRoot = node.id === payload.rootArtistId;
                const isSelected = node.id === selectedArtistId;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedArtistId(node.id);
                      if (node.id !== payload.rootArtistId) {
                        setRootArtistId(node.id);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedArtistId(node.id);
                        if (node.id !== payload.rootArtistId) {
                          setRootArtistId(node.id);
                        }
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      r={isRoot ? 19 : 14}
                      fill={
                        isRoot
                          ? "rgba(16,185,129,0.9)"
                          : isSelected
                            ? "rgba(34,211,238,0.95)"
                            : "rgba(39,39,42,0.95)"
                      }
                      stroke={isRoot ? "#a7f3d0" : "#67e8f9"}
                      strokeWidth={isSelected ? 2.5 : 1.4}
                    />
                    <text
                      y={isRoot ? 33 : 29}
                      textAnchor="middle"
                      fill="#f4f4f5"
                      fontSize={isRoot ? 13 : 11}
                    >
                      {clampText(node.name, compact ? 13 : 16)}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-md border border-zinc-700 bg-zinc-900/50 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
                  Selected Artist
                </p>
                <p className="mt-1 text-base text-white">
                  {selected?.name ?? payload.rootArtistName}
                </p>
                {selected?.genres.length ? (
                  <p className="mt-1 text-xs text-zinc-300">
                    {selected.genres.slice(0, 3).join(" • ")}
                  </p>
                ) : null}
              </div>

              <div className="rounded-md border border-zinc-700 bg-zinc-900/50 p-3 text-right">
                <p className="text-xs text-zinc-400">
                  {layout.nodes.length} artists
                </p>
                <p className="text-xs text-zinc-400">Depth {payload.depth}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Updated {timeAgo(payload.updatedAt)}
                </p>
              </div>
            </div>

            {payload.warnings.length > 0 ? (
              <p className="mt-3 text-xs text-amber-300">
                Partial graph returned ({payload.warnings.length} warning
                {payload.warnings.length > 1 ? "s" : ""}).
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
