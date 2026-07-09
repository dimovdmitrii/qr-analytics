"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { TimeseriesPoint } from "@/lib/data/analytics";

// Theme-aware tooltip: inline CSS variables resolve against the themed DOM,
// so this reads correctly in both light and dark mode.
const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-lg)",
  fontSize: 12,
  color: "var(--color-foreground)",
} as const;

export function ScansChart({ data }: { data: TimeseriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="scans-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          tickFormatter={(d: string) => d.slice(5)}
          interval="preserveStartEnd"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          allowDecimals={false}
          width={32}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "var(--color-muted)", marginBottom: 2 }}
          itemStyle={{ color: "var(--color-foreground)" }}
          cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.3, strokeWidth: 1 }}
          labelFormatter={(d) => `Date: ${d}`}
        />
        <Area
          type="monotone"
          dataKey="scans"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#scans-fill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
