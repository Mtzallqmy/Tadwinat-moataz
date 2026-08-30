"use server";

import { revalidatePath } from "next/cache";
import { assertCmsUser } from "@/lib/auth/authorization";
import { createCampaign, sendCampaignBatch } from "@/lib/email/newsletter";
import { emailProvider } from "@/lib/email/provider";
import { campaignEmail } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { zonedDateTimeToUtc } from "@/lib/datetime/timezone";

export async function createNewsletterCampaignAction(formData: FormData) {
  const user = await assertCmsUser("content.publish");
  const subject = String(formData.get("subject") ?? "").trim();
  const preheader = String(formData.get("preheader") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const scheduledLocal = String(formData.get("scheduledAt") ?? "").trim();
  let scheduledAt: string | null = null;
  if (scheduledLocal) {
    const supabase = createAdminClient();
    const { data } = await supabase.from("site_settings").select("timezone").eq("id", true).single();
    scheduledAt = zonedDateTimeToUtc(scheduledLocal, data?.timezone || "Asia/Aden");
    if (new Date(scheduledAt) <= new Date()) throw new Error("CAMPAIGN_SCHEDULE_MUST_BE_FUTURE");
  }
  await createCampaign({ subject, preheader, body, createdBy: user.id, scheduledAt });
  revalidatePath("/admin/newsletter");
}

export async function sendNewsletterCampaignAction(formData: FormData) {
  await assertCmsUser("content.publish");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await sendCampaignBatch(id, 100);
  revalidatePath("/admin/newsletter");
}

export async function cancelNewsletterCampaignAction(formData: FormData) {
  await assertCmsUser("content.publish");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createAdminClient();
  await supabase.from("newsletter_campaigns").update({ status: "cancelled", scheduled_at: null }).eq("id", id).in("status", ["draft", "scheduled", "failed"]);
  revalidatePath("/admin/newsletter");
}

export async function sendNewsletterTestAction(formData: FormData) {
  await assertCmsUser("content.publish");
  const to = String(formData.get("to") ?? "").trim().toLowerCase();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(to)) throw new Error("INVALID_TEST_EMAIL");
  const supabase = createAdminClient();
  const { data: settings } = await supabase.from("site_settings").select("newsletter_sender_name,newsletter_sender_email,newsletter_reply_to,newsletter_footer").eq("id", true).single();
  if (!settings?.newsletter_sender_email) throw new Error("NEWSLETTER_SENDER_EMAIL_NOT_CONFIGURED");
  const emailSubject = `[اختبار] ${subject}`;
  const template = campaignEmail({ subject: emailSubject, body, unsubscribeUrl: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/u, "")}/newsletter/unsubscribe`, footer: settings.newsletter_footer });
  await emailProvider.sendEmail({ to, from: `${settings.newsletter_sender_name} <${settings.newsletter_sender_email}>`, replyTo: settings.newsletter_reply_to, subject: emailSubject, ...template, idempotencyKey: `newsletter-test:${Date.now()}` });
}
