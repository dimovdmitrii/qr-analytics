import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

export async function listQrCodes(tenantId: string) {
  try {
    return await prisma.qrCode.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { scanEvents: true } } },
    });
  } catch (err) {
    console.warn("listQrCodes: falling back to empty list", err);
    return [];
  }
}

export async function createQrCode(tenantId: string, label: string, targetUrl: string, tags: string[] = []) {
  const shortCode = nanoid();
  return prisma.qrCode.create({
    data: { tenantId, label, targetUrl, shortCode, tags },
  });
}
