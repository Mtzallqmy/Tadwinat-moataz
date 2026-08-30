"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
  next: z.string().optional(),
});

function safeNextPath(value?: string) {
  return value?.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=config");
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    redirect("/admin/login?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect("/admin/login?error=credentials");
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsError ? null : claimsData?.claims?.sub;

  if (typeof userId !== "string") {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.is_active) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  redirect(safeNextPath(parsed.data.next));
}
