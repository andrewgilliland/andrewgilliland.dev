import { useEffect, useState } from "react";

type FlowType = "inbound" | "outbound";

type NodeDef = {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
};

const nodeStyles: Record<string, Omit<NodeDef, "id" | "label" | "sublabel">> = {
  internet: { color: "#4ade80", bg: "#052e16", border: "#16a34a" },
  igw: { color: "#fbbf24", bg: "#1c1917", border: "#d97706" },
  alb: { color: "#fde68a", bg: "#1c1917", border: "#d97706" },
  nat: { color: "#fde68a", bg: "#1c1917", border: "#d97706" },
  ec2: { color: "#a5b4fc", bg: "#1e1b4b", border: "#6366f1" },
  rds: { color: "#fca5a5", bg: "#450a0a", border: "#dc2626" },
  secrets: { color: "#c4b5fd", bg: "#1a1a2e", border: "#7c3aed" },
};

const nodesByFlow: Record<FlowType, NodeDef[]> = {
  inbound: [
    {
      id: "internet",
      label: "Internet",
      sublabel: "User request",
      ...nodeStyles.internet,
    },
    {
      id: "igw",
      label: "IGW",
      sublabel: "Internet Gateway",
      ...nodeStyles.igw,
    },
    { id: "alb", label: "ALB", sublabel: "Public subnet", ...nodeStyles.alb },
    { id: "ec2", label: "EC2", sublabel: "Private subnet", ...nodeStyles.ec2 },
    { id: "rds", label: "RDS", sublabel: "Isolated subnet", ...nodeStyles.rds },
  ],
  outbound: [
    { id: "ec2", label: "EC2", sublabel: "Private subnet", ...nodeStyles.ec2 },
    {
      id: "nat",
      label: "NAT GW",
      sublabel: "Public subnet",
      ...nodeStyles.nat,
    },
    {
      id: "igw",
      label: "IGW",
      sublabel: "Internet Gateway",
      ...nodeStyles.igw,
    },
    {
      id: "secrets",
      label: "Secrets Mgr",
      sublabel: "AWS API",
      ...nodeStyles.secrets,
    },
  ],
};

type Step = {
  fromIndex: number;
  toIndex: number;
  edgeIndex: number;
  port: string;
  desc: string;
  isReturn?: boolean;
};

const inboundSteps: Step[] = [
  {
    fromIndex: 0,
    toIndex: 1,
    edgeIndex: 0,
    port: "HTTPS :443",
    desc: "User's browser sends an HTTPS request to the ALB's DNS name. The Internet Gateway routes it into the VPC.",
  },
  {
    fromIndex: 1,
    toIndex: 2,
    edgeIndex: 1,
    port: "→ public subnet",
    desc: "IGW forwards the packet to the ALB node in the public subnet. The ALB terminates TLS and inspects the request.",
  },
  {
    fromIndex: 2,
    toIndex: 3,
    edgeIndex: 2,
    port: "HTTP :8080",
    desc: "ALB selects a healthy EC2 target via the target group and forwards the request over port 8080 inside the VPC.",
  },
  {
    fromIndex: 3,
    toIndex: 4,
    edgeIndex: 3,
    port: "PostgreSQL :5432",
    desc: "EC2 runs the business logic and queries RDS on port 5432. The connection uses the RDS endpoint hostname which resolves via Route 53.",
  },
  {
    fromIndex: 4,
    toIndex: 3,
    edgeIndex: 3,
    port: "query result",
    isReturn: true,
    desc: "RDS returns the query result to EC2 over the same VPC-internal connection.",
  },
  {
    fromIndex: 3,
    toIndex: 2,
    edgeIndex: 2,
    port: "HTTP response",
    isReturn: true,
    desc: "EC2 sends the HTTP response back to the ALB.",
  },
  {
    fromIndex: 2,
    toIndex: 1,
    edgeIndex: 1,
    port: "HTTPS response",
    isReturn: true,
    desc: "ALB re-encrypts and sends the HTTPS response back through the IGW.",
  },
  {
    fromIndex: 1,
    toIndex: 0,
    edgeIndex: 0,
    port: "→ user",
    isReturn: true,
    desc: "IGW delivers the response to the user's browser. Round trip complete.",
  },
];

const outboundSteps: Step[] = [
  {
    fromIndex: 0,
    toIndex: 1,
    edgeIndex: 0,
    port: "HTTPS :443",
    desc: "EC2 initiates an outbound HTTPS request (e.g., to Secrets Manager). Private subnets route 0.0.0.0/0 to the NAT Gateway.",
  },
  {
    fromIndex: 1,
    toIndex: 2,
    edgeIndex: 1,
    port: "NAT translation",
    desc: "The NAT Gateway replaces EC2's private IP with its own Elastic IP. The EC2 instance's private address is never exposed.",
  },
  {
    fromIndex: 2,
    toIndex: 3,
    edgeIndex: 2,
    port: "→ AWS API",
    desc: "The request exits via the IGW to the AWS Secrets Manager endpoint. AWS verifies the IAM role attached to the EC2 instance.",
  },
];

function PacketDot({ color, onDone }: { color: string; onDone: () => void }) {
  const [pos, setPos] = useState<"start" | "end">("start");

  useEffect(() => {
    const t1 = setTimeout(() => setPos("end"), 20);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (pos === "end") {
      const t2 = setTimeout(onDone, 620);
      return () => clearTimeout(t2);
    }
  }, [pos, onDone]);

  return (
    <div
      className="absolute top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full"
      style={{
        background: color,
        left: pos === "start" ? "-6px" : "calc(100% - 6px)",
        transition: "left 0.58s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  );
}

export default function TrafficFlowDiagram() {
  const [flowType, setFlowType] = useState<FlowType>("inbound");
  const [stepIndex, setStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [packetEdge, setPacketEdge] = useState<number | null>(null);

  const steps = flowType === "inbound" ? inboundSteps : outboundSteps;
  const nodes = nodesByFlow[flowType];
  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null;

  function advanceStep(index: number) {
    if (index >= steps.length) {
      setIsPlaying(false);
      return;
    }
    setStepIndex(index);
    setPacketEdge(steps[index].edgeIndex);
  }

  function handlePacketDone() {
    setPacketEdge(null);
    setTimeout(() => advanceStep(stepIndex + 1), 120);
  }

  function handlePlay() {
    setStepIndex(-1);
    setPacketEdge(null);
    setIsPlaying(true);
    setTimeout(() => advanceStep(0), 50);
  }

  function handleReset() {
    setIsPlaying(false);
    setStepIndex(-1);
    setPacketEdge(null);
  }

  function switchFlow(type: FlowType) {
    setIsPlaying(false);
    setStepIndex(-1);
    setPacketEdge(null);
    setFlowType(type);
  }

  const activeNodes = currentStep
    ? new Set([currentStep.fromIndex, currentStep.toIndex])
    : new Set<number>();

  const isReturn = currentStep?.isReturn ?? false;
  const packetColor = isReturn ? "#38bdf8" : "#ec4899";

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-white">Traffic Flow</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex overflow-hidden rounded-full border border-white/10 text-sm">
            <button
              onClick={() => switchFlow("inbound")}
              className={`px-4 py-1.5 lowercase transition-colors ${
                flowType === "inbound"
                  ? "bg-pink-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              inbound
            </button>
            <button
              onClick={() => switchFlow("outbound")}
              className={`px-4 py-1.5 lowercase transition-colors ${
                flowType === "outbound"
                  ? "bg-sky-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              outbound
            </button>
          </div>
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="rounded-full bg-pink-500 px-4 py-1.5 text-sm lowercase text-white transition-all hover:shadow-[2px_2px_0_0_#fff] disabled:cursor-not-allowed disabled:opacity-40 motion-safe:hover:-translate-x-1 motion-safe:hover:-translate-y-1"
          >
            ▶ play
          </button>
          <button
            onClick={handleReset}
            className="rounded-full border border-white/10 px-4 py-1.5 text-sm lowercase text-gray-400 transition-colors hover:text-white"
          >
            reset
          </button>
        </div>
      </div>

      <div className="flex items-center overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const isActive = activeNodes.has(i);
          const isCompleted =
            stepIndex >= 0 && !isReturn && i < (currentStep?.toIndex ?? -1);

          return (
            <div
              key={`${flowType}-${node.id}-${i}`}
              className="flex items-center"
            >
              <div
                className="relative flex min-w-[90px] flex-col items-center rounded-xl p-3 text-center transition-all duration-300"
                style={{
                  background: node.bg,
                  border: `1.5px solid ${isActive ? (isReturn ? "#38bdf8" : "#ec4899") : node.border}`,
                  boxShadow: isActive
                    ? `0 0 12px ${isReturn ? "#38bdf888" : "#ec489966"}`
                    : isCompleted
                      ? `0 0 6px ${node.border}44`
                      : "none",
                }}
              >
                <div
                  className="absolute left-0 right-0 top-0 h-1 rounded-t-xl transition-colors duration-300"
                  style={{
                    background: isActive
                      ? isReturn
                        ? "#38bdf8"
                        : "#ec4899"
                      : node.border,
                  }}
                />
                <div
                  className="mt-1 font-mono text-xs font-bold transition-colors duration-300"
                  style={{
                    color: isActive
                      ? isReturn
                        ? "#38bdf8"
                        : "#ec4899"
                      : node.color,
                  }}
                >
                  {node.label}
                </div>
                <div className="mt-0.5 font-mono text-[9px] leading-tight text-gray-500">
                  {node.sublabel}
                </div>
              </div>

              {i < nodes.length - 1 && (
                <div className="relative mx-1 flex h-8 min-w-[36px] flex-1 items-center">
                  {currentStep && currentStep.edgeIndex === i && (
                    <div
                      className="absolute -top-5 left-0 right-0 text-center font-mono text-[9px]"
                      style={{ color: isReturn ? "#38bdf8" : "#ec4899" }}
                    >
                      {currentStep.port}
                    </div>
                  )}
                  <div
                    className="absolute inset-x-0 top-1/2 h-px transition-colors duration-300"
                    style={{
                      background:
                        currentStep?.edgeIndex === i
                          ? isReturn
                            ? "#38bdf8"
                            : "#ec4899"
                          : "#374151",
                    }}
                  />
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs leading-none transition-colors duration-300"
                    style={{
                      color:
                        currentStep?.edgeIndex === i
                          ? isReturn
                            ? "#38bdf8"
                            : "#ec4899"
                          : "#374151",
                    }}
                  >
                    {isReturn && currentStep?.edgeIndex === i ? "◀" : "▶"}
                  </div>
                  {packetEdge === i && (
                    <PacketDot color={packetColor} onDone={handlePacketDone} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === stepIndex ? "20px" : "8px",
              height: "8px",
              background:
                i === stepIndex
                  ? isReturn
                    ? "#38bdf8"
                    : "#ec4899"
                  : i < stepIndex
                    ? "#6b7280"
                    : "#374151",
            }}
          />
        ))}
      </div>

      <div className="mt-3 min-h-[52px] rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 font-mono text-sm">
        {currentStep ? (
          <p className="text-xs leading-relaxed text-gray-300">
            {currentStep.desc}
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            {flowType === "inbound"
              ? "Inbound: Internet → IGW → ALB → EC2 → RDS → response"
              : "Outbound: EC2 → NAT Gateway → IGW → AWS API"}
          </p>
        )}
      </div>
    </div>
  );
}
