import { requireTenant } from "@/lib/tenant";
import { getTimeseries, getDeviceBreakdown } from "@/lib/data/analytics";
import { listQrCodes } from "@/lib/data/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScansChart } from "@/components/dashboard/scans-chart";
import { DeviceBreakdown } from "@/components/dashboard/device-breakdown";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { tenantId } = await requireTenant();
  const { range } = await searchParams;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const [timeseries, breakdown, codes] = await Promise.all([
    getTimeseries(tenantId!, days),
    getDeviceBreakdown(tenantId!),
    listQrCodes(tenantId!),
  ]);

  const totalForRange = timeseries.reduce((sum: number, p: { scans: number }) => sum + p.scans, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted">{totalForRange} scans in the selected range.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1 text-sm">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <a
              key={r}
              href={`/dashboard/analytics?range=${r}`}
              className={`rounded-md px-3 py-1 ${
                days === parseInt(r) ? "bg-primary text-primary-foreground" : "text-muted hover:bg-muted-bg"
              }`}
            >
              {r}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Scans over time</CardTitle>
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
          <CardTitle className="text-foreground text-sm">Per-QR performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {codes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No QR codes yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 font-medium">Label</th>
                  <th className="py-2 font-medium">Total scans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {codes.map((c: (typeof codes)[number]) => (
                  <tr key={c.id}>
                    <td className="py-2.5">{c.label}</td>
                    <td className="py-2.5">{c._count.scanEvents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
