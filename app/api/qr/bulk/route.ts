import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/tenant";
import { createQrCode } from "@/lib/data/qr";
import Papa from "papaparse";
import { z } from "zod";

// Expects a CSV with headers: label,targetUrl
const rowSchema = z.object({
  label: z.string().min(1),
  targetUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.csv || typeof body.csv !== "string") {
    return NextResponse.json({ error: "Missing csv field" }, { status: 400 });
  }

  const parsed = Papa.parse(body.csv.trim(), { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "Could not parse CSV" }, { status: 400 });
  }

  const created: string[] = [];
  const failed: { row: number; reason: string }[] = [];

  for (const [i, row] of (parsed.data as Record<string, string>[]).entries()) {
    const result = rowSchema.safeParse(row);
    if (!result.success) {
      failed.push({ row: i + 1, reason: result.error.issues[0]?.message ?? "invalid row" });
      continue;
    }
    const qr = await createQrCode(ctx.tenantId, result.data.label, result.data.targetUrl);
    created.push(qr.id);
  }

  return NextResponse.json({ createdCount: created.length, failed });
}
