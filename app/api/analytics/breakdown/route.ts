import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/tenant";
import { getDeviceBreakdown } from "@/lib/data/analytics";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const breakdown = await getDeviceBreakdown(ctx.tenantId);
  return NextResponse.json({ breakdown });
}
