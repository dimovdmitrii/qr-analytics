import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  trendPct,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  trendPct?: number;
  hint?: string;
  icon?: LucideIcon;
}) {
  const display = typeof value === "number" ? formatNumber(value) : value;

  return (
    <Card className="card-interactive">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-3xl font-semibold tracking-tight">{display}</span>
          {typeof trendPct === "number" && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
                trendPct > 0
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : trendPct < 0
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "text-muted",
              )}
            >
              {trendPct > 0 ? "+" : ""}
              {trendPct}%
            </span>
          )}
        </div>
        {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      </CardContent>
    </Card>
  );
}
