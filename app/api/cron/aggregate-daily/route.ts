import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

// Nightly rollup job — populates analytics_daily so dashboards never GROUP BY
// the full scan_events history. Wired via Vercel Cron (see vercel.json) or
// Supabase pg_cron. Protected by a shared secret, not user auth, since it's
// invoked by the scheduler rather than a logged-in tenant.
// See docs/SYSTEM_DESIGN.md section 6.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = subDays(new Date(), 1);
  const dayStart = startOfDay(yesterday);
  const dayEnd = endOfDay(yesterday);

  const grouped = await prisma.scanEvent.groupBy({
    by: ["qrCodeId", "tenantId"],
    where: { scannedAt: { gte: dayStart, lte: dayEnd }, isBot: false },
    _count: { _all: true },
  });

  let upserted = 0;
  for (const g of grouped) {
    await prisma.analyticsDaily.upsert({
      where: { qrCodeId_day: { qrCodeId: g.qrCodeId, day: dayStart } },
      create: {
        qrCodeId: g.qrCodeId,
        tenantId: g.tenantId,
        day: dayStart,
        scanCount: g._count._all,
      },
      update: { scanCount: g._count._all },
    });
    upserted++;
  }

  return NextResponse.json({ ok: true, day: dayStart.toISOString(), upserted });
}
