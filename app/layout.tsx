import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Analytics — attribution dashboard for craft businesses",
  description:
    "Track which QR code drove which scan. Real-time analytics, device/location breakdowns, and CSV/PDF exports for craftspeople and small businesses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the theme on the server from a cookie so the correct class is set
  // before first paint (no flash-of-unstyled-content, no client-side script).
  const isDark = (await cookies()).get("theme")?.value === "dark";

  return (
    <html lang="en" className={`h-full antialiased${isDark ? " dark" : ""}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
