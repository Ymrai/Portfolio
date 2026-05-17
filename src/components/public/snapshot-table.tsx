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
    <div className="mb-10 md:mb-16" style={{ borderTop: border }}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between py-3 md:py-5 gap-4 md:gap-20"
          style={{ borderBottom: border }}
        >
          <span
            className="font-semibold text-foreground shrink-0 text-sm md:text-xl"
            style={{ minWidth: "100px" }}
          >
            {row.label}
          </span>
          <span
            className="text-right text-sm md:text-xl"
            style={{ color: valueColor }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
