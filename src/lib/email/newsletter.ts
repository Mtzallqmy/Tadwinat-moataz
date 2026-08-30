import { createAdminClient } from "@/lib/supabase/admin";
import { emailProvider } from "@/lib/email/provider";
import { campaignEmail, confirmationEmail } from "@/lib/email/templates";
import { createOpaqueToken, hashToken } from "@/lib/security/tokens";
import { NewsletterError } from "@/lib/integrations/errors";

function siteBaseUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) throw new NewsletterError("SITE_URL_NOT_CONFIGURED");
  return value.replace(/\/$/u, "");
}

async function newsletterSettings() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("site_settings").select("site_name,newsletter_sender_name,newsletter_sender_email,newsletter_reply_to,newsletter_footer,newsletter_double_opt_in").eq("id", true).single();
  if (error) throw new NewsletterError(`NEWSLETTER_SETTINGS_FAILED: ${error.message}`);
  return data;
}

export async function sendConfirmationEmail(email: string, rawToken: string) {
  const settings = await newsletterSettings();
  if (!settings.newsletter_sender_email) throw new NewsletterError("NEWSLETTER_SENDER_EMAIL_NOT_CONFIGURED");
  const confirmUrl = `${siteBaseUrl()}/newsletter/confirm?token=${encodeURIComponent(rawToken)}`;
  const template = confirmationEmail({ siteName: settings.site_name, confirmUrl, footer: settings.newsletter_footer });
  return emailProvider.sendEmail({
    to: email,
    from: `${settings.newsletter_sender_name} <${settings.newsletter_sender_email}>`,
    replyTo: settings.newsletter_reply_to,
    ...template,
    idempotencyKey: `newsletter-confirm:${hashToken(email)}:${hashToken(rawToken).slice(0, 24)}`,
  });
}

export async function createCampaign(input: { subject: string; preheader?: string; body: string; createdBy: string; scheduledAt?: string | null }) {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || subject.length > 240 || !body || body.length > 50_000) throw new NewsletterError("INVALID_CAMPAIGN_INPUT");
  const supabase = createAdminClient();
  const status = input.scheduledAt ? "scheduled" : "draft";
  const { data, error } = await supabase.from("newsletter_campaigns").insert({
    subject,
    preheader: input.preheader?.trim().slice(0, 500) ?? "",
    content_text: body,
    content_html: "",
    status,
    scheduled_at: input.scheduledAt ?? null,
    created_by: input.createdBy,
  }).select("id").single();
  if (error) throw new NewsletterError(`CAMPAIGN_CREATE_FAILED: ${error.message}`);
  return data.id as string;
}

export async function sendCampaignBatch(campaignId: string, limit = 50) {
  const supabase = createAdminClient();
  const settings = await newsletterSettings();
  if (!settings.newsletter_sender_email) throw new NewsletterError("NEWSLETTER_SENDER_EMAIL_NOT_CONFIGURED");
  const { data: campaign, error: campaignError } = await supabase.from("newsletter_campaigns").select("id,subject,preheader,content_text,status").eq("id", campaignId).single();
  if (campaignError || !campaign) throw new NewsletterError("CAMPAIGN_NOT_FOUND");
  if (["sent", "cancelled"].includes(campaign.status)) return { sent: 0, failed: 0, remaining: 0, complete: campaign.status === "sent" };

  await supabase.from("newsletter_campaigns").update({ status: "sending", last_error: null }).eq("id", campaignId);
  const { data: subscribers, error: subscriberError } = await supabase.from("subscribers").select("id,email").eq("status", "active").order("created_at", { ascending: true }).limit(Math.min(Math.max(limit, 1), 100));
  if (subscriberError) throw new NewsletterError(`SUBSCRIBERS_READ_FAILED: ${subscriberError.message}`);

  let sent = 0;
  let failed = 0;
  for (const subscriber of subscribers ?? []) {
    const { data: existing } = await supabase.from("newsletter_deliveries").select("id,status,attempt_count").eq("campaign_id", campaignId).eq("subscriber_id", subscriber.id).maybeSingle();
    if (existing && ["sent", "delivered", "opened", "clicked"].includes(existing.status)) continue;
    const attempts = Number(existing?.attempt_count ?? 0);
    if (attempts >= 3) continue;
    const rawUnsubscribe = createOpaqueToken();
    await supabase.from("subscribers").update({ unsubscribe_token_hash: hashToken(rawUnsubscribe) }).eq("id", subscriber.id);
    const unsubscribeUrl = `${siteBaseUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(rawUnsubscribe)}`;
    const template = campaignEmail({ subject: campaign.subject, preheader: campaign.preheader, body: campaign.content_text, unsubscribeUrl, footer: settings.newsletter_footer });
    try {
      const response = await emailProvider.sendEmail({
        to: subscriber.email,
        from: `${settings.newsletter_sender_name} <${settings.newsletter_sender_email}>`,
        replyTo: settings.newsletter_reply_to,
        ...template,
        idempotencyKey: `campaign:${campaignId}:${subscriber.id}`,
      });
      await supabase.from("newsletter_deliveries").upsert({ campaign_id: campaignId, subscriber_id: subscriber.id, provider_message_id: response.id, status: "sent", sent_at: new Date().toISOString(), error_message: null, attempt_count: attempts + 1, next_retry_at: null }, { onConflict: "campaign_id,subscriber_id" });
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      const nextRetry = attempts + 1 < 3 ? new Date(Date.now() + 2 ** attempts * 60_000).toISOString() : null;
      await supabase.from("newsletter_deliveries").upsert({ campaign_id: campaignId, subscriber_id: subscriber.id, status: "failed", error_message: message.slice(0, 1000), attempt_count: attempts + 1, next_retry_at: nextRetry }, { onConflict: "campaign_id,subscriber_id" });
      failed += 1;
    }
  }

  const { count: activeCount } = await supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active");
  const { count: successfulCount } = await supabase.from("newsletter_deliveries").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).in("status", ["sent", "delivered", "opened", "clicked"]);
  const remaining = Math.max(0, (activeCount ?? 0) - (successfulCount ?? 0));
  const complete = remaining === 0 && failed === 0;
  await supabase.from("newsletter_campaigns").update(complete ? { status: "sent", sent_at: new Date().toISOString(), last_error: null } : { status: failed ? "failed" : "sending", last_error: failed ? `${failed} delivery failures in last batch` : null }).eq("id", campaignId);
  return { sent, failed, remaining, complete };
}

export async function sendDueCampaigns(limit = 5) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("newsletter_campaigns").select("id").in("status", ["scheduled", "sending", "failed"]).or(`scheduled_at.is.null,scheduled_at.lte.${now}`).order("scheduled_at", { ascending: true }).limit(limit);
  if (error) throw new NewsletterError(`DUE_CAMPAIGNS_FAILED: ${error.message}`);
  const results = [];
  for (const campaign of data ?? []) results.push({ id: campaign.id, ...(await sendCampaignBatch(campaign.id)) });
  return results;
}
