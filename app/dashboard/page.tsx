import { requireTenant } from "@/lib/tenant";
import { getSummaryStats, getTimeseries, getDeviceBreakdown, getRecentScans } from "@/lib/data/analytics";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ScansChart } from "@/components/dashboard/scans-chart";
import { DeviceBreakdown } from "@/components/dashboard/device-breakdown";
import { RecentScans } from "@/components/dashboard/recent-scans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanLine, TrendingUp, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const { tenantId } = await requireTenant();

  const [summary, timeseries, breakdown, recentScans] = await Promise.all([
    getSummaryStats(tenantId!),
    getTimeseries(tenantId!, 30),
    getDeviceBreakdown(tenantId!),
    getRecentScans(tenantId!, 8),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted">Attribution and scan activity across all your QR codes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total scans" value={summary.totalScans} hint="All time, bots excluded" icon={ScanLine} />
        <KpiCard
          label="Scans (last 7 days)"
          value={summary.scansLast7d}
          trendPct={summary.scansTrendPct}
          hint="vs. previous 7 days"
          icon={TrendingUp}
        />
        <KpiCard
          label="Top QR code"
          value={summary.topQrLabel ?? "—"}
          hint="Most scanned code"
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Scans — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <ScansChart data={timeseries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Device breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceBreakdown data={breakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Recent scans</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RecentScans scans={recentScans as never} />
        </CardContent>
      </Card>
    </div>
  );
}
