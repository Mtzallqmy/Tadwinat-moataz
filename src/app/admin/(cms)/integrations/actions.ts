"use server";

import { revalidatePath } from "next/cache";
import { assertCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export async function saveTelegramSettingsAction(formData: FormData) {
  await assertCmsUser("settings.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").update({ telegram_auto_post_enabled: formData.get("autoPost") === "on", telegram_notify_owner_enabled: formData.get("notifyOwner") === "on" }).eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/integrations"); revalidatePath("/admin/integrations/telegram");
}

export async function addTelegramUserAction(formData: FormData) {
  await assertCmsUser("settings.manage");
  const rawId = String(formData.get("telegramUserId") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 120);
  const role = String(formData.get("role") ?? "editor");
  if (!/^\d{5,20}$/u.test(rawId) || !["owner","admin","editor"].includes(role)) throw new Error("INVALID_TELEGRAM_USER");
  const supabase = await createClient();
  const { error } = await supabase.from("telegram_users").upsert({ telegram_user_id: Number(rawId), display_name: displayName, role, is_active: true }, { onConflict: "telegram_user_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/integrations/telegram");
}

export async function toggleTelegramUserAction(formData: FormData) {
  await assertCmsUser("settings.manage");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("telegram_users").update({ is_active: active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/integrations/telegram");
}

export async function saveNewsletterSettingsAction(formData: FormData) {
  await assertCmsUser("settings.manage");
  const senderName = String(formData.get("senderName") ?? "").trim().slice(0, 120) || "معتز العلقمي";
  const senderEmail = String(formData.get("senderEmail") ?? "").trim().toLowerCase() || null;
  const replyTo = String(formData.get("replyTo") ?? "").trim().toLowerCase() || null;
  if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(senderEmail)) throw new Error("INVALID_SENDER_EMAIL");
  if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(replyTo)) throw new Error("INVALID_REPLY_EMAIL");
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").update({ newsletter_double_opt_in: formData.get("doubleOptIn") === "on", newsletter_auto_send_new_posts: formData.get("autoSend") === "on", newsletter_sender_name: senderName, newsletter_sender_email: senderEmail, newsletter_reply_to: replyTo, newsletter_footer: String(formData.get("footer") ?? "").trim().slice(0, 1000) }).eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/integrations/newsletter"); revalidatePath("/admin/newsletter");
}

export async function saveAutomationRuleAction(formData: FormData) {
  await assertCmsUser("settings.manage");
  const event = String(formData.get("event") ?? "");
  const action = String(formData.get("action") ?? "");
  const allowedEvents = ["post.published","post.scheduled","post.failed","contact.received","newsletter.subscribed"];
  const allowedActions = ["telegram.notify_owner","telegram.post_channel","newsletter.send_article"];
  if (!allowedEvents.includes(event) || !allowedActions.includes(action)) throw new Error("INVALID_AUTOMATION_RULE");
  const supabase = await createClient();
  const { error } = await supabase.from("automation_rules").insert({ event, action, config: {}, is_active: true });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/integrations/automations");
}

export async function toggleAutomationRuleAction(formData: FormData) {
  await assertCmsUser("settings.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("automation_rules").update({ is_active: String(formData.get("active")) === "true" }).eq("id", String(formData.get("id") ?? ""));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/integrations/automations");
}
