import Link from "next/link";
import { QrCode } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="brand-glow" aria-hidden />
      <div className="relative z-10 w-full max-w-sm animate-in">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-token-md">
              <QrCode className="h-5 w-5" />
            </span>
            QR<span className="text-primary">Analytics</span>
          </Link>
          <p className="mt-3 text-sm text-muted">
            Attribution and scan analytics for your QR codes.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
