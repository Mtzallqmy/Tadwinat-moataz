import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TelegramRole } from "@/lib/telegram/types";

export function webhookSecretMatches(value: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || expected.includes("placeholder") || !value) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function envOwnerIds() {
  return new Set((process.env.TELEGRAM_OWNER_IDS ?? "").split(",").map((item) => item.trim()).filter(Boolean).map(Number).filter(Number.isSafeInteger));
}

export async function authorizeTelegramUser(telegramUserId: number): Promise<{ allowed: boolean; role?: TelegramRole; source?: "env" | "database" }> {
  if (!Number.isSafeInteger(telegramUserId)) return { allowed: false };
  if (envOwnerIds().has(telegramUserId)) return { allowed: true, role: "owner", source: "env" };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("telegram_users").select("role,is_active").eq("telegram_user_id", telegramUserId).maybeSingle();
    if (error || !data?.is_active) return { allowed: false };
    return { allowed: true, role: data.role as TelegramRole, source: "database" };
  } catch {
    return { allowed: false };
  }
}

const commandPermissions: Record<string, ReadonlySet<TelegramRole>> = {
  start: new Set(["owner", "admin", "editor"]),
  help: new Set(["owner", "admin", "editor"]),
  new: new Set(["owner", "admin", "editor"]),
  drafts: new Set(["owner", "admin", "editor"]),
  latest: new Set(["owner", "admin", "editor"]),
  queue: new Set(["owner", "admin", "editor"]),
  search: new Set(["owner", "admin", "editor"]),
  stats: new Set(["owner", "admin"]),
  settings: new Set(["owner", "admin"]),
  publish: new Set(["owner", "admin", "editor"]),
  archive: new Set(["owner", "admin", "editor"]),
  schedule: new Set(["owner", "admin", "editor"]),
};

export function telegramRoleCan(role: TelegramRole, command: string) {
  return commandPermissions[command]?.has(role) ?? false;
}
