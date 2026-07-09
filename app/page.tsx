import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, QrCode, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="text-lg font-semibold tracking-tight">
          QR<span className="text-primary">Analytics</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants({})}>
            Sign up
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Know which QR code brought the customer in.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          A lightweight analytics layer for the QR codes you already hand out — scans, devices,
          locations, and attribution, per company, in real time.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Log in
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 pt-6 text-sm">
              <QrCode className="h-5 w-5 text-primary" />
              <p className="font-medium">Shared QR infrastructure</p>
              <p className="text-muted">Reuses codes already issued — no new plates to print.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 pt-6 text-sm">
              <BarChart3 className="h-5 w-5 text-primary" />
              <p className="font-medium">Real-time attribution</p>
              <p className="text-muted">See exactly which company&rsquo;s code drove each scan.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 pt-6 text-sm">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="font-medium">Privacy-first</p>
              <p className="text-muted">No raw IPs stored — coarse geo + device only.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="flex items-center justify-center gap-1 py-6 text-xs text-muted">
        <Zap className="h-3 w-3" /> Built with Next.js, Supabase &amp; Prisma
      </footer>
    </div>
  );
}
