import crypto from "crypto";

// Raw IPs are never persisted — only a salted hash. See docs/SECURITY.md section 2.
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "dev-salt-change-me";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /facebookexternalhit/i,
  /slackbot/i,
  /whatsapp/i,
  /curl\//i,
  /wget/i,
];

export function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return true;
  return BOT_PATTERNS.some((p) => p.test(ua));
}

export type ParsedUserAgent = {
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  browser: string;
  os: string;
};

// Deliberately simple UA parsing (no dependency) — good enough for dashboard
// breakdown charts. Revisit with a proper UA parser if precision matters more.
export function parseUserAgent(ua: string | null): ParsedUserAgent {
  if (!ua) return { deviceType: "unknown", browser: "Unknown", os: "Unknown" };

  const deviceType = /mobile/i.test(ua)
    ? "mobile"
    : /tablet|ipad/i.test(ua)
      ? "tablet"
      : "desktop";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome\//i.test(ua)
      ? "Chrome"
      : /safari\//i.test(ua) && !/chrome/i.test(ua)
        ? "Safari"
        : /firefox\//i.test(ua)
          ? "Firefox"
          : "Other";

  const os = /windows/i.test(ua)
    ? "Windows"
    : /mac os|macos/i.test(ua)
      ? "macOS"
      : /android/i.test(ua)
        ? "Android"
        : /iphone|ipad|ios/i.test(ua)
          ? "iOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Other";

  return { deviceType, browser, os };
}
