import { useState } from "react";

const subnetStyles = {
  public: {
    fill: "bg-green-950",
    border: "border-green-600",
    text: "text-green-400",
    badgeBg: "bg-green-600/20",
    legendBg: "bg-green-600",
  },
  private: {
    fill: "bg-indigo-950",
    border: "border-indigo-500",
    text: "text-indigo-300",
    badgeBg: "bg-indigo-500/20",
    legendBg: "bg-indigo-500",
  },
  isolated: {
    fill: "bg-red-950",
    border: "border-red-600",
    text: "text-red-300",
    badgeBg: "bg-red-600/20",
    legendBg: "bg-red-600",
  },
} as const;

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

function SubnetCard({
  subnet,
  isSelected,
  onClick,
}: {
  subnet: SubnetInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  const sc = subnetStyles[subnet.type];
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border-[1.5px] p-3 text-left transition-all duration-200 ${sc.fill} ${isSelected ? "border-pink-500" : sc.border}`}
    >
      <div
        className={`mb-1 font-mono text-xs font-bold ${isSelected ? "text-pink-500" : sc.text}`}
      >
        {subnet.label}
      </div>
      <div className="font-mono text-[10px] text-gray-400">{subnet.cidr}</div>
      <div className="mt-2 space-y-1">
        {subnet.resources.map((r) => (
          <div
            key={r}
            className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${isSelected ? "bg-pink-500/10 text-pink-500" : `${sc.badgeBg} ${sc.text}`}`}
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

      <div className="rounded-xl border border-gray-700 bg-black p-3">
        <div className="mb-2 font-mono text-xs text-gray-500">
          VPC - 10.0.0.0/16
        </div>

        <div className="my-3 rounded-lg border border-amber-600/50 bg-stone-900 py-2 text-center font-mono text-xs font-semibold text-amber-400">
          Internet Gateway
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
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {[
          { key: "public" as const, label: "Public (IGW route)" },
          { key: "private" as const, label: "Private (NAT route)" },
          { key: "isolated" as const, label: "Isolated (no route)" },
        ].map(({ key, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={`h-3 w-3 rounded-sm ${subnetStyles[key].legendBg}`}
            />
            <span className="font-mono text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-900/80 p-4 font-mono text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`font-semibold ${subnetStyles[selected.type].text}`}
            >
              {selected.label} - {selected.cidr}
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
            <pre className="mt-1 whitespace-pre-wrap p-1 text-xs text-gray-300">
              {selected.routeTable}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
