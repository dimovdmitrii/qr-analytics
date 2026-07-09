import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/tenant";
import { getTimeseries } from "@/lib/data/analytics";

export async function GET(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const range = req.nextUrl.searchParams.get("range") ?? "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const timeseries = await getTimeseries(ctx.tenantId, days);
  return NextResponse.json({ timeseries });
}
