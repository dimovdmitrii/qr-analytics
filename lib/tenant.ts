import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type SessionContext = {
  userId: string;
  email: string;
  tenantId: string | null;
  role: "owner" | "member" | "admin";
} | null;

// Resolves the authenticated user AND their tenant/role from our own `users`
// table (not just the Supabase auth session) so RLS-relevant fields are
// always read from the source of truth. Never trust a tenantId passed from
// the client for access control — see docs/SECURITY.md section 1.
export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return null;

    return {
      userId: dbUser.id,
      email: dbUser.email,
      tenantId: dbUser.tenantId,
      role: dbUser.role,
    };
  } catch (err) {
    console.error("getSessionContext: database lookup failed", err);
    return null;
  }
}

// Throws if there's no authenticated tenant — use in Server Components/route
// handlers that require a logged-in company account.
export async function requireTenant(): Promise<NonNullable<SessionContext>> {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.tenantId) {
    throw new Error("UNAUTHENTICATED");
  }
  return ctx as NonNullable<SessionContext>;
}
