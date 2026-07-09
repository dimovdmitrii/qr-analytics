"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { BreakdownItem } from "@/lib/data/analytics";

const COLORS = ["#6366f1", "#a78bfa", "#22c55e", "#f59e0b", "#ef4444"];

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-lg)",
  fontSize: 12,
  color: "var(--color-foreground)",
} as const;

export function DeviceBreakdown({ data }: { data: BreakdownItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted">
        No scans yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={3}
          cornerRadius={5}
          stroke="var(--color-card)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--color-foreground)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
