import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenantId } }).catch(() => null);
  const isDark = (await cookies()).get("theme")?.value === "dark";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar companyName={tenant?.name ?? "Your company"} />
      <div className="surface-wash flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
          <span className="truncate text-sm font-medium text-muted">{tenant?.name ?? "Your company"}</span>
          <ThemeToggle initialDark={isDark} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
