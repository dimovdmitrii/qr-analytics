import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/tenant";
import { listQrCodes, createQrCode } from "@/lib/data/qr";
import { createQrSchema } from "@/lib/validations";

// tenantId is ALWAYS resolved from the session, never trusted from the
// request body — see docs/SECURITY.md section 1.
export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await listQrCodes(ctx.tenantId);
  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createQrSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const qr = await createQrCode(ctx.tenantId, parsed.data.label, parsed.data.targetUrl, parsed.data.tags);
  return NextResponse.json({ qr }, { status: 201 });
}
