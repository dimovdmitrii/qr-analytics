import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/tenant";
import { getSummaryStats } from "@/lib/data/analytics";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await getSummaryStats(ctx.tenantId);
  return NextResponse.json(summary);
}
