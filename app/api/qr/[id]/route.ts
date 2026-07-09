import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  targetUrl: z.string().url().optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Scoped by tenantId in the WHERE clause, not just the id — this is what
  // prevents tenant A from reading tenant B's QR code by guessing an id.
  const qr = await prisma.qrCode.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!qr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ qr });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.qrCode.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const qr = await prisma.qrCode.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ qr });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.qrCode.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.qrCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
