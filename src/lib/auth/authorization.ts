import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AppRole = "owner" | "admin" | "editor" | "author" | "reviewer";

export interface CmsUser {
  id: string;
  email?: string;
  displayName: string;
  role: AppRole;
  isActive: boolean;
}

export type CmsCapability =
  | "content.read"
  | "content.create"
  | "content.publish"
  | "taxonomy.manage"
  | "media.manage"
  | "appearance.manage"
  | "settings.manage"
  | "users.manage"
  | "audit.read";

const ROLE_CAPABILITIES: Record<AppRole, ReadonlySet<CmsCapability>> = {
  owner: new Set([
    "content.read",
    "content.create",
    "content.publish",
    "taxonomy.manage",
    "media.manage",
    "appearance.manage",
    "settings.manage",
    "users.manage",
    "audit.read",
  ]),
  admin: new Set([
    "content.read",
    "content.create",
    "content.publish",
    "taxonomy.manage",
    "media.manage",
    "appearance.manage",
    "settings.manage",
    "users.manage",
    "audit.read",
  ]),
  editor: new Set([
    "content.read",
    "content.create",
    "content.publish",
    "taxonomy.manage",
    "media.manage",
  ]),
  author: new Set(["content.read", "content.create", "media.manage"]),
  reviewer: new Set(["content.read"]),
};

export function hasCapability(role: AppRole, capability: CmsCapability) {
  return ROLE_CAPABILITIES[role].has(capability);
}

export async function getCurrentCmsUser(): Promise<CmsUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsError ? null : claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile || !profile.is_active) return null;

  return {
    id: profile.id,
    email: typeof claims?.email === "string" ? claims.email : undefined,
    displayName: profile.display_name,
    role: profile.role as AppRole,
    isActive: profile.is_active,
  };
}

export async function requireCmsUser(capability?: CmsCapability) {
  const user = await getCurrentCmsUser();
  if (!user) redirect("/admin/login");
  if (capability && !hasCapability(user.role, capability)) {
    redirect("/admin/unauthorized");
  }
  return user;
}

export async function assertCmsUser(capability?: CmsCapability) {
  const user = await getCurrentCmsUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  if (capability && !hasCapability(user.role, capability)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
