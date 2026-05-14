"use client";

import { useTheme } from "@/components/providers/theme-provider";

interface SnapshotRow {
  label: string;
  value: string;
}

interface SnapshotTableProps {
  rows: SnapshotRow[];
}

export function SnapshotTable({ rows }: SnapshotTableProps) {
  const { resolvedTheme } = useTheme();
  const valueColor = resolvedTheme === "dark" ? "#A0A8BC" : "#757575";
  const borderColor = resolvedTheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const border = `1px solid ${borderColor}`;

  return (
    <div className="mb-16" style={{ borderTop: border }}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between py-5"
          style={{ gap: "80px", borderBottom: border }}
        >
          <span className="font-semibold text-foreground shrink-0" style={{ fontSize: "20px", minWidth: "160px" }}>
            {row.label}
          </span>
          <span className="text-right" style={{ fontSize: "20px", color: valueColor }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
