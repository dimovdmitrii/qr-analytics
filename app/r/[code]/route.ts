import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, isBotUserAgent, parseUserAgent } from "@/lib/scan-utils";

// Public, unauthenticated redirect endpoint — this IS the physical QR code's
// destination. Latency here is user-facing, so the 302 is issued immediately
// and scan logging happens afterwards via `after()`. See docs/SYSTEM_DESIGN.md
// section 5 and docs/SECURITY.md section 3.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Cheap format check before touching the database — basic hygiene against
  // enumeration probing on this unauthenticated route.
  if (!/^[a-z0-9]{4,16}$/i.test(code)) {
    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  }

  const qr = await prisma.qrCode.findUnique({ where: { shortCode: code } });
  if (!qr || qr.status !== "active") {
    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  }

  // target_url is only ever a value the tenant configured via the
  // authenticated dashboard — never taken from this incoming request.
  // Open-redirect hygiene per docs/SECURITY.md section 3.
  const response = NextResponse.redirect(qr.targetUrl, { status: 302 });

  after(async () => {
    try {
      const ua = req.headers.get("user-agent");
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown";
      const country = req.headers.get("x-vercel-ip-country") ?? null;
      const city = req.headers.get("x-vercel-ip-city") ?? null;
      const { deviceType, browser, os } = parseUserAgent(ua);

      await prisma.scanEvent.create({
        data: {
          qrCodeId: qr.id,
          tenantId: qr.tenantId,
          ipHash: hashIp(ip),
          country: country ? decodeURIComponent(country) : null,
          city: city ? decodeURIComponent(city) : null,
          deviceType,
          browser,
          os,
          referrer: req.headers.get("referer"),
          isBot: isBotUserAgent(ua),
        },
      });
    } catch (err) {
      // Never let a logging failure affect the redirect — it has already
      // been sent to the client by the time this runs.
      console.error("scan logging failed", err);
    }
  });

  return response;
}
