import { useEffect, useState, useCallback } from "react";

const C = {
  bg: "#0a0a0a",
  cardBg: "#111827",
  cardBorder: "#374151",
  albColor: "#d97706",
  albFill: "#1c1917",
  albBorder: "#d97706",
  appColor: "#6366f1",
  appFill: "#1e1b4b",
  appBorder: "#6366f1",
  dbColor: "#dc2626",
  dbFill: "#450a0a",
  dbBorder: "#dc2626",
  internetColor: "#4ade80",
  arrowActive: "#ec4899",
  arrowIdle: "#374151",
  labelText: "#9ca3af",
  titleText: "#f9fafb",
  blocked: "#ef4444",
  allowed: "#4ade80",
  packetColor: "#ec4899",
};

type Flow = "legitimate" | "attack" | null;

type SgNode = {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  fill: string;
  border: string;
  inboundRules: { port: string; source: string; allowed: boolean }[];
  outboundRules: { port: string; dest: string; allowed: boolean }[];
};

const nodes: SgNode[] = [
  {
    id: "internet",
    label: "Internet",
    sublabel: "0.0.0.0/0",
    color: C.internetColor,
    fill: "#052e16",
    border: "#16a34a",
    inboundRules: [],
    outboundRules: [],
  },
  {
    id: "alb",
    label: "alb-sg",
    sublabel: "Application Load Balancer",
    color: C.albColor,
    fill: C.albFill,
    border: C.albBorder,
    inboundRules: [
      { port: "443", source: "0.0.0.0/0", allowed: true },
      { port: "80", source: "0.0.0.0/0", allowed: true },
    ],
    outboundRules: [{ port: "8080", dest: "app-sg", allowed: true }],
  },
  {
    id: "app",
    label: "app-sg",
    sublabel: "EC2 / Auto Scaling Group",
    color: C.appColor,
    fill: C.appFill,
    border: C.appBorder,
    inboundRules: [{ port: "8080", source: "alb-sg", allowed: true }],
    outboundRules: [
      { port: "5432", dest: "db-sg", allowed: true },
      { port: "443", dest: "0.0.0.0/0", allowed: true },
    ],
  },
  {
    id: "db",
    label: "db-sg",
    sublabel: "RDS PostgreSQL",
    color: C.dbColor,
    fill: C.dbFill,
    border: C.dbBorder,
    inboundRules: [{ port: "5432", source: "app-sg", allowed: true }],
    outboundRules: [],
  },
];

const edges = [
  { from: "internet", to: "alb", port: "443 / 80", id: "e0" },
  { from: "alb", to: "app", port: "8080", id: "e1" },
  { from: "app", to: "db", port: "5432", id: "e2" },
];

type SimState =
  | { type: "idle" }
  | { type: "animating"; edgeIndex: number; isAttack: boolean }
  | { type: "blocked" }
  | { type: "done" };

function PacketDot({ color, onDone }: { color: string; onDone: () => void }) {
  const [pos, setPos] = useState<"start" | "end">("start");

  useEffect(() => {
    const t = setTimeout(() => setPos("end"), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (pos === "end") {
      const t = setTimeout(onDone, 560);
      return () => clearTimeout(t);
    }
  }, [pos, onDone]);

  return (
    <div
      className="absolute top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full"
      style={{
        background: color,
        left: pos === "start" ? "-6px" : "calc(100% - 6px)",
        transition: "left 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  );
}

export default function SecurityGroupDiagram() {
  const [sim, setSim] = useState<SimState>({ type: "idle" });
  const [selected, setSelected] = useState<SgNode | null>(null);

  const advanceEdge = useCallback((edgeIndex: number, isAttack: boolean) => {
    if (isAttack && edgeIndex >= 1) {
      setSim({ type: "blocked" });
      setTimeout(() => setSim({ type: "idle" }), 1800);
      return;
    }
    if (edgeIndex >= edges.length) {
      setSim({ type: "done" });
      setTimeout(() => setSim({ type: "idle" }), 800);
      return;
    }
    setSim({ type: "animating", edgeIndex, isAttack });
  }, []);

  function runFlow(isAttack: boolean) {
    setSelected(null);
    advanceEdge(0, isAttack);
  }

  function handlePacketDone(edgeIndex: number, isAttack: boolean) {
    advanceEdge(edgeIndex + 1, isAttack);
  }

  const isAnimating = sim.type === "animating";
  const activeEdge = isAnimating ? sim.edgeIndex : -1;
  const isAttack = isAnimating ? sim.isAttack : false;

  const activeNodeIds = new Set<string>();
  if (isAnimating) {
    const edge = edges[sim.edgeIndex];
    if (edge) {
      activeNodeIds.add(edge.from);
      activeNodeIds.add(edge.to);
    }
  }

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-white">Security Group Chain</h3>
        <div className="flex gap-2">
          <button
            onClick={() => runFlow(false)}
            disabled={sim.type !== "idle"}
            className="rounded-full bg-pink-500 px-4 py-1.5 text-sm lowercase text-white transition-all hover:shadow-[2px_2px_0_0_#fff] disabled:cursor-not-allowed disabled:opacity-40 motion-safe:hover:-translate-x-1 motion-safe:hover:-translate-y-1"
          >
            simulate request
          </button>
          <button
            onClick={() => runFlow(true)}
            disabled={sim.type !== "idle"}
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm lowercase text-white transition-all hover:shadow-[2px_2px_0_0_#fff] disabled:cursor-not-allowed disabled:opacity-40 motion-safe:hover:-translate-x-1 motion-safe:hover:-translate-y-1"
          >
            simulate attack
          </button>
        </div>
      </div>

      {/* Chain */}
      <div className="flex items-center overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const isActive = activeNodeIds.has(node.id);
          const isBlocked = sim.type === "blocked" && node.id === "app";

          return (
            <div key={node.id} className="flex items-center">
              {/* Node card */}
              <button
                onClick={() =>
                  setSelected((prev) => (prev?.id === node.id ? null : node))
                }
                className="relative flex min-w-[110px] flex-col items-center overflow-hidden rounded-xl p-3 text-center transition-all duration-300"
                style={{
                  background: node.fill,
                  border: `1.5px solid ${
                    isBlocked
                      ? "#ef4444"
                      : isActive
                        ? "#ec4899"
                        : selected?.id === node.id
                          ? "#ec4899"
                          : node.border
                  }`,
                  boxShadow: isActive
                    ? "0 0 12px #ec489966"
                    : isBlocked
                      ? "0 0 12px #ef444466"
                      : "none",
                }}
              >
                {/* Top accent bar */}
                <div
                  className="absolute left-0 right-0 top-0 h-1 transition-colors duration-300"
                  style={{
                    background: isBlocked
                      ? "#ef4444"
                      : isActive
                        ? "#ec4899"
                        : node.border,
                  }}
                />
                {/* Blocked overlay */}
                {isBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-red-950/80">
                    <span className="text-lg font-bold text-red-400">✕</span>
                  </div>
                )}
                <div
                  className="mt-1 font-mono text-xs font-bold transition-colors duration-300"
                  style={{
                    color: isActive
                      ? "#ec4899"
                      : isBlocked
                        ? "#ef4444"
                        : node.color,
                  }}
                >
                  {node.label}
                </div>
                <div className="mt-0.5 font-mono text-[9px] leading-tight text-gray-500">
                  {node.sublabel.length > 20
                    ? node.sublabel.slice(0, 18) + "…"
                    : node.sublabel}
                </div>
                {(node.inboundRules.length > 0 ||
                  node.outboundRules.length > 0) && (
                  <div className="mt-1.5 font-mono text-[8px] text-gray-600">
                    {node.inboundRules.length} in · {node.outboundRules.length}{" "}
                    out
                  </div>
                )}
              </button>

              {/* Connector */}
              {i < nodes.length - 1 && (
                <div className="relative mx-1 flex h-8 min-w-[40px] flex-1 items-center">
                  {/* Port label */}
                  <div
                    className="absolute -top-5 left-0 right-0 text-center font-mono text-[9px] transition-colors duration-300"
                    style={{
                      color: activeEdge === i ? "#ec4899" : "#4b5563",
                    }}
                  >
                    {edges[i]?.port ? `port ${edges[i].port}` : ""}
                  </div>
                  {/* Line */}
                  <div
                    className="absolute inset-x-0 top-1/2 h-px transition-colors duration-300"
                    style={{
                      background: activeEdge === i ? "#ec4899" : "#374151",
                    }}
                  />
                  {/* Arrow */}
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs leading-none transition-colors duration-300"
                    style={{
                      color: activeEdge === i ? "#ec4899" : "#374151",
                    }}
                  >
                    ▶
                  </div>
                  {/* Animated packet */}
                  {isAnimating && activeEdge === i && (
                    <PacketDot
                      color={isAttack ? "#ef4444" : "#ec4899"}
                      onDone={() => handlePacketDone(i, isAttack)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      {sim.type === "blocked" && (
        <div className="mt-2 rounded-lg border border-red-800/50 bg-red-950/50 px-4 py-2 font-mono text-xs text-red-400">
          ✕ request blocked — app-sg only allows port 8080 from alb-sg
        </div>
      )}
      {sim.type === "done" && (
        <div className="mt-2 rounded-lg border border-green-800/50 bg-green-950/50 px-4 py-2 font-mono text-xs text-green-400">
          ✓ request completed — all security group rules matched
        </div>
      )}

      {/* Detail panel */}
      {selected && selected.id !== "internet" && (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-900/80 p-4 font-mono text-sm">
          <div
            className="mb-3 text-base font-semibold"
            style={{ color: selected.color }}
          >
            {selected.label}
            <span className="ml-2 text-xs font-normal text-gray-400">
              {selected.sublabel}
            </span>
          </div>

          {selected.inboundRules.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                Inbound Rules
              </div>
              {selected.inboundRules.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-white/5 py-1 text-xs text-gray-300"
                >
                  <span className="text-green-400">↓</span>
                  <span className="text-gray-400">port</span>
                  <span className="font-semibold text-white">{r.port}</span>
                  <span className="text-gray-400">from</span>
                  <span className="text-pink-400">{r.source}</span>
                </div>
              ))}
            </div>
          )}

          {selected.outboundRules.length > 0 && (
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                Outbound Rules
              </div>
              {selected.outboundRules.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-white/5 py-1 text-xs text-gray-300"
                >
                  <span className="text-blue-400">↑</span>
                  <span className="text-gray-400">port</span>
                  <span className="font-semibold text-white">{r.port}</span>
                  <span className="text-gray-400">to</span>
                  <span className="text-indigo-400">{r.dest}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="mt-3 font-mono text-xs text-gray-500">
        click a node to inspect its rules · simulate request to animate a packet
        through the chain
      </p>
    </div>
  );
}
