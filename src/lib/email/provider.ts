import { IntegrationConfigError, NewsletterError } from "@/lib/integrations/errors";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string | null;
  idempotencyKey?: string;
};

export interface EmailProvider {
  name: string;
  configured: boolean;
  sendEmail(message: EmailMessage): Promise<{ id: string }>;
  sendBatch(messages: EmailMessage[]): Promise<Array<{ id: string }>>;
}

function resendFrom(message: EmailMessage) {
  const configured = message.from?.trim() || process.env.NEWSLETTER_FROM?.trim();
  if (!configured) throw new IntegrationConfigError("NEWSLETTER_SENDER_NOT_CONFIGURED");
  return configured;
}

async function resendRequest(path: string, body: unknown, idempotencyKey?: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("re_ci_placeholder")) throw new IntegrationConfigError("RESEND_API_KEY_NOT_CONFIGURED");
  const response = await fetch(`https://api.resend.com/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey.slice(0, 256) } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json().catch(() => ({})) as { id?: string; data?: Array<{ id?: string }>; message?: string };
  if (!response.ok) throw new NewsletterError(`EMAIL_PROVIDER_${response.status}: ${payload.message ?? "request failed"}`);
  return payload;
}

export const emailProvider: EmailProvider = {
  name: "Resend",
  get configured() { return Boolean(process.env.RESEND_API_KEY?.trim() && !process.env.RESEND_API_KEY?.startsWith("re_ci_placeholder")); },
  async sendEmail(message) {
    const payload = await resendRequest("emails", {
      from: resendFrom(message),
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject.replace(/[\r\n]+/gu, " ").slice(0, 998),
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }, message.idempotencyKey);
    if (!payload.id) throw new NewsletterError("EMAIL_PROVIDER_MISSING_ID");
    return { id: payload.id };
  },
  async sendBatch(messages) {
    if (!messages.length) return [];
    const payload = await resendRequest("emails/batch", messages.map((message) => ({
      from: resendFrom(message),
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject.replace(/[\r\n]+/gu, " ").slice(0, 998),
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    })));
    const ids = payload.data?.map((item) => item.id).filter((id): id is string => Boolean(id)) ?? [];
    if (ids.length !== messages.length) throw new NewsletterError("EMAIL_BATCH_PARTIAL_RESPONSE");
    return ids.map((id) => ({ id }));
  },
};
