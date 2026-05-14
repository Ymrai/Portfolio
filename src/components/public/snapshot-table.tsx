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

  return (
    <div className="mb-16" style={{ borderTop: "1.5px solid #D0D0D0" }}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between py-5"
          style={{ gap: "80px", borderBottom: "1.5px solid #D0D0D0" }}
        >
          <span className="font-semibold text-foreground shrink-0" style={{ fontSize: "20px" }}>
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
