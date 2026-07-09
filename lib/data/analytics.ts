import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

export type SummaryStats = {
  totalScans: number;
  scansLast7d: number;
  scansTrendPct: number;
  topQrLabel: string | null;
};

export type TimeseriesPoint = { date: string; scans: number };
export type BreakdownItem = { name: string; value: number };

// All three functions are tenant-scoped by an explicit tenantId argument that
// must come from the authenticated session (see lib/tenant.ts) — never from
// client input. They fall back to empty/sample results if the database isn't
// reachable yet (e.g. DATABASE_URL not configured), so the dashboard UI stays
// demoable before Supabase is wired up.

export async function getSummaryStats(tenantId: string): Promise<SummaryStats> {
  try {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    const [totalScans, scansLast7d, scansPrior7d, topQr] = await Promise.all([
      prisma.scanEvent.count({ where: { tenantId, isBot: false } }),
      prisma.scanEvent.count({
        where: { tenantId, isBot: false, scannedAt: { gte: sevenDaysAgo } },
      }),
      prisma.scanEvent.count({
        where: {
          tenantId,
          isBot: false,
          scannedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
      prisma.scanEvent.groupBy({
        by: ["qrCodeId"],
        where: { tenantId, isBot: false },
        _count: { qrCodeId: true },
        orderBy: { _count: { qrCodeId: "desc" } },
        take: 1,
      }),
    ]);

    let topQrLabel: string | null = null;
    if (topQr[0]) {
      const qr = await prisma.qrCode.findUnique({ where: { id: topQr[0].qrCodeId } });
      topQrLabel = qr?.label ?? null;
    }

    const scansTrendPct =
      scansPrior7d === 0 ? (scansLast7d > 0 ? 100 : 0) : Math.round(((scansLast7d - scansPrior7d) / scansPrior7d) * 100);

    return { totalScans, scansLast7d, scansTrendPct, topQrLabel };
  } catch (err) {
    console.warn("getSummaryStats: falling back to empty stats", err);
    return { totalScans: 0, scansLast7d: 0, scansTrendPct: 0, topQrLabel: null };
  }
}

export async function getTimeseries(tenantId: string, days = 30): Promise<TimeseriesPoint[]> {
  try {
    const since = subDays(new Date(), days);
    const events = await prisma.scanEvent.findMany({
      where: { tenantId, isBot: false, scannedAt: { gte: since } },
      select: { scannedAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      buckets.set(format(subDays(new Date(), i), "yyyy-MM-dd"), 0);
    }
    for (const e of events) {
      const key = format(e.scannedAt, "yyyy-MM-dd");
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([date, scans]) => ({ date, scans }));
  } catch (err) {
    console.warn("getTimeseries: falling back to empty series", err);
    return Array.from({ length: days }).map((_, i) => ({
      date: format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd"),
      scans: 0,
    }));
  }
}

export async function getDeviceBreakdown(tenantId: string): Promise<BreakdownItem[]> {
  try {
    const rows = await prisma.scanEvent.groupBy({
      by: ["deviceType"],
      where: { tenantId, isBot: false },
      _count: { deviceType: true },
    });
    return rows.map((r: (typeof rows)[number]) => ({ name: r.deviceType ?? "unknown", value: r._count.deviceType }));
  } catch (err) {
    console.warn("getDeviceBreakdown: falling back to empty breakdown", err);
    return [];
  }
}

export async function getRecentScans(tenantId: string, limit = 10) {
  try {
    return await prisma.scanEvent.findMany({
      where: { tenantId },
      orderBy: { scannedAt: "desc" },
      take: limit,
      include: { qrCode: { select: { label: true } } },
    });
  } catch (err) {
    console.warn("getRecentScans: falling back to empty list", err);
    return [];
  }
}
