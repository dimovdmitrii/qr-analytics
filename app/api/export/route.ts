import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

// Exports go through the SAME tenant-scoped query as the dashboard —
// a common bug class is an export endpoint that skips the filters the UI
// applies. See docs/SECURITY.md section 6.
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  const scans = await prisma.scanEvent.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { scannedAt: "desc" },
    take: 5000,
    include: { qrCode: { select: { label: true } } },
  });

  const rows = scans.map((s: (typeof scans)[number]) => ({
    qrCode: s.qrCode.label,
    scannedAt: s.scannedAt.toISOString(),
    country: s.country ?? "",
    city: s.city ?? "",
    deviceType: s.deviceType ?? "",
    browser: s.browser ?? "",
    os: s.os ?? "",
    referrer: s.referrer ?? "",
    isBot: s.isBot,
  }));

  if (format === "json") {
    return NextResponse.json({ rows });
  }

  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="scan-export-${Date.now()}.csv"`,
    },
  });
}
