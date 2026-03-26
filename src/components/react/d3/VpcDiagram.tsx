import { useState } from "react";

const colors = {
  vpcBorder: "#374151",
  vpcFill: "#0a0a0a",
  azFill: "#111827",
  azBorder: "#374151",
  publicFill: "#052e16",
  publicBorder: "#16a34a",
  publicText: "#4ade80",
  privateFill: "#1e1b4b",
  privateBorder: "#6366f1",
  privateText: "#a5b4fc",
  isolatedFill: "#450a0a",
  isolatedBorder: "#dc2626",
  isolatedText: "#fca5a5",
  labelText: "#9ca3af",
  titleText: "#f9fafb",
  highlight: "#ec4899",
  tooltipBg: "#1f2937",
  tooltipBorder: "#4b5563",
  tooltipText: "#f9fafb",
  igwFill: "#1c1917",
  igwBorder: "#d97706",
  igwText: "#fbbf24",
};

type SubnetInfo = {
  id: string;
  label: string;
  cidr: string;
  type: "public" | "private" | "isolated";
  az: "A" | "B";
  resources: string[];
  routeTable: string;
};

const subnets: SubnetInfo[] = [
  {
    id: "pub-a",
    label: "Public Subnet",
    cidr: "10.0.0.0/24",
    type: "public",
    az: "A",
    resources: ["ALB Node", "NAT Gateway"],
    routeTable: "0.0.0.0/0 → Internet Gateway\n10.0.0.0/16 → local",
  },
  {
    id: "pub-b",
    label: "Public Subnet",
    cidr: "10.0.1.0/24",
    type: "public",
    az: "B",
    resources: ["ALB Node", "NAT Gateway"],
    routeTable: "0.0.0.0/0 → Internet Gateway\n10.0.0.0/16 → local",
  },
  {
    id: "priv-a",
    label: "Private Subnet",
    cidr: "10.0.2.0/24",
    type: "private",
    az: "A",
    resources: ["EC2 Instance (ASG)"],
    routeTable: "0.0.0.0/0 → NAT Gateway (AZ-A)\n10.0.0.0/16 → local",
  },
  {
    id: "priv-b",
    label: "Private Subnet",
    cidr: "10.0.3.0/24",
    type: "private",
    az: "B",
    resources: ["EC2 Instance (ASG)"],
    routeTable: "0.0.0.0/0 → NAT Gateway (AZ-B)\n10.0.0.0/16 → local",
  },
  {
    id: "iso-a",
    label: "Isolated Subnet",
    cidr: "10.0.4.0/24",
    type: "isolated",
    az: "A",
    resources: ["RDS Primary"],
    routeTable: "10.0.0.0/16 → local\n(no internet route)",
  },
  {
    id: "iso-b",
    label: "Isolated Subnet",
    cidr: "10.0.5.0/24",
    type: "isolated",
    az: "B",
    resources: ["RDS Standby (Multi-AZ)"],
    routeTable: "10.0.0.0/16 → local\n(no internet route)",
  },
];

function getSubnetColors(type: SubnetInfo["type"]) {
  switch (type) {
    case "public":
      return {
        fill: colors.publicFill,
        border: colors.publicBorder,
        text: colors.publicText,
      };
    case "private":
      return {
        fill: colors.privateFill,
        border: colors.privateBorder,
        text: colors.privateText,
      };
    case "isolated":
      return {
        fill: colors.isolatedFill,
        border: colors.isolatedBorder,
        text: colors.isolatedText,
      };
  }
}

function SubnetCard({
  subnet,
  isSelected,
  onClick,
}: {
  subnet: SubnetInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  const sc = getSubnetColors(subnet.type);
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg p-3 text-left transition-all duration-200"
      style={{
        background: sc.fill,
        border: `1.5px solid ${isSelected ? "#ec4899" : sc.border}`,
        boxShadow: isSelected ? `0 0 10px #ec489966` : "none",
      }}
    >
      <div
        className="mb-1 font-mono text-xs font-bold"
        style={{ color: isSelected ? "#ec4899" : sc.text }}
      >
        {subnet.label}
      </div>
      <div className="font-mono text-[10px] text-gray-400">{subnet.cidr}</div>
      <div className="mt-2 space-y-1">
        {subnet.resources.map((r) => (
          <div
            key={r}
            className="rounded px-1.5 py-0.5 font-mono text-[9px]"
            style={{
              background: isSelected ? "#ec489922" : sc.border + "33",
              color: isSelected ? "#ec4899" : sc.text,
            }}
          >
            {r}
          </div>
        ))}
      </div>
    </button>
  );
}

export default function VpcDiagram() {
  const [selected, setSelected] = useState<SubnetInfo | null>(null);

  const azA = subnets.filter((s) => s.az === "A");
  const azB = subnets.filter((s) => s.az === "B");

  return (
    <div className="not-prose my-8 rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">VPC Architecture</h3>
        <span className="font-mono text-xs text-gray-500">
          click a subnet to inspect
        </span>
      </div>

      <div className="rounded-xl border border-gray-700 bg-[#0a0a0a] p-3">
        <div className="mb-2 font-mono text-xs text-gray-500">
          VPC — 10.0.0.0/16
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Availability Zone A", items: azA },
            { label: "Availability Zone B", items: azB },
          ].map(({ label, items }) => (
            <div
              key={label}
              className="rounded-lg border border-dashed border-gray-700 bg-gray-900 p-2"
            >
              <div className="mb-2 text-center font-mono text-[10px] text-gray-400">
                {label}
              </div>
              <div className="space-y-2">
                {items.map((subnet) => (
                  <SubnetCard
                    key={subnet.id}
                    subnet={subnet}
                    isSelected={selected?.id === subnet.id}
                    onClick={() =>
                      setSelected((prev) =>
                        prev?.id === subnet.id ? null : subnet,
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-amber-600/50 bg-stone-900 py-2 text-center font-mono text-xs font-semibold text-amber-400">
          Internet Gateway
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {[
          { color: colors.publicBorder, label: "Public (IGW route)" },
          { color: colors.privateBorder, label: "Private (NAT route)" },
          { color: colors.isolatedBorder, label: "Isolated (no route)" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: color + "44", border: `1px solid ${color}` }}
            />
            <span className="font-mono text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-900/80 p-4 font-mono text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="font-semibold"
              style={{ color: getSubnetColors(selected.type).text }}
            >
              {selected.label} — {selected.cidr}
            </span>
            <span className="text-xs text-gray-500">AZ {selected.az}</span>
          </div>
          <div className="mb-2">
            <span className="text-xs uppercase tracking-wider text-gray-400">
              Resources
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {selected.resources.map((r) => (
                <span
                  key={r}
                  className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-200"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400">
              Route Table
            </span>
            <pre className="mt-1 whitespace-pre-wrap text-xs text-gray-300">
              {selected.routeTable}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
