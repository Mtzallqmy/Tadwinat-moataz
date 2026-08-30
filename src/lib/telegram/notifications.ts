import { createAdminClient } from "@/lib/supabase/admin";
import { telegramClient } from "@/lib/telegram/client";
import type { InlineKeyboard } from "@/lib/telegram/types";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/u, "");
}

export async function notifyOwners(text: string, replyMarkup?: InlineKeyboard) {
  const ids = new Set<number>();
  for (const value of (process.env.TELEGRAM_OWNER_IDS ?? "").split(",")) {
    const id = Number(value.trim());
    if (Number.isSafeInteger(id)) ids.add(id);
  }
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("telegram_users").select("telegram_user_id").eq("is_active", true).in("role", ["owner", "admin"]);
    for (const row of data ?? []) {
      const id = Number(row.telegram_user_id);
      if (Number.isSafeInteger(id)) ids.add(id);
    }
  } catch {
    // Environment bootstrap remains usable before database access is configured.
  }
  const results = await Promise.allSettled([...ids].map((id) => telegramClient.sendMessage(id, text, replyMarkup)));
  return results.filter((item) => item.status === "fulfilled").length;
}

export async function postPublishedToChannel(post: { id: string; slug: string; title: string; excerpt?: string | null; cover?: string | null }) {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId) return { skipped: true, reason: "CHANNEL_NOT_CONFIGURED" } as const;
  const supabase = createAdminClient();
  const { data: settings } = await supabase.from("site_settings").select("telegram_auto_post_enabled").eq("id", true).maybeSingle();
  if (!settings?.telegram_auto_post_enabled) return { skipped: true, reason: "AUTO_POST_DISABLED" } as const;
  const { data: existing } = await supabase.from("telegram_channel_deliveries").select("id,status,telegram_message_id").eq("post_id", post.id).eq("channel_id", channelId).maybeSingle();
  if (existing?.status === "sent") return { skipped: true, reason: "ALREADY_SENT", messageId: existing.telegram_message_id } as const;

  const url = `${siteUrl()}/posts/${encodeURIComponent(post.slug)}`;
  const caption = `<b>${escapeHtml(post.title)}</b>${post.excerpt ? `\n\n${escapeHtml(post.excerpt.slice(0, 500))}` : ""}\n\nاقرأ: ${escapeHtml(url)}`;
  try {
    const sent = post.cover
      ? await telegramClient.sendPhoto(channelId, post.cover, caption, { inline_keyboard: [[{ text: "فتح المقال", url }]] })
      : await telegramClient.sendMessage(channelId, caption, { inline_keyboard: [[{ text: "فتح المقال", url }]] });
    await supabase.from("telegram_channel_deliveries").upsert({ post_id: post.id, channel_id: channelId, telegram_message_id: sent.message_id, status: "sent", error_message: null }, { onConflict: "post_id,channel_id" });
    await supabase.from("analytics_events").insert({ event_name: "telegram_channel_post", entity_type: "post", entity_id: post.id, metadata: {} });
    return { skipped: false, messageId: sent.message_id } as const;
  } catch (error) {
    await supabase.from("telegram_channel_deliveries").upsert({ post_id: post.id, channel_id: channelId, status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "unknown" }, { onConflict: "post_id,channel_id" });
    throw error;
  }
}

export function publicationMessage(post: { title: string; slug: string }) {
  const url = `${siteUrl()}/posts/${encodeURIComponent(post.slug)}`;
  return `✅ تم نشر المقال\n<b>${escapeHtml(post.title)}</b>\n${escapeHtml(url)}`;
}

export function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
