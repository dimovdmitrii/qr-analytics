"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { signInSchema, signUpSchema } from "@/lib/validations";

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { companyName, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign up did not return a user — try again." };

  // Create the tenant + mirrored user row. Uses the admin client because RLS
  // policies require an authenticated session with a tenant_id claim that
  // doesn't exist yet at this exact moment (chicken-and-egg on first signup).
  const admin = createAdminClient();
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || `company-${Date.now()}`;

  const tenant = await prisma.tenant.create({
    data: { name: companyName, slug },
  });

  await prisma.user.create({
    data: { id: data.user.id, tenantId: tenant.id, email, role: "owner" },
  });

  void admin; // reserved for future use (e.g. immediate email confirmation)

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
