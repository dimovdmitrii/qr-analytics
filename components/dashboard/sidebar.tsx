"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, QrCode, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/qr", label: "QR Codes", icon: QrCode },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  const initial = companyName.trim().charAt(0).toUpperCase() || "Q";

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-4">
      <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-token-sm">
          <QrCode className="h-[18px] w-[18px]" />
        </span>
        QR<span className="text-primary">Analytics</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-token-md"
                  : "text-muted hover:bg-muted-bg hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border pt-3">
        <div className="mb-1 flex items-center gap-2 px-1 py-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initial}
          </span>
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{companyName}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-muted-bg hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
