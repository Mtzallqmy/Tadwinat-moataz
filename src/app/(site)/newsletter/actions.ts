"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { createOpaqueToken, hashToken, safeTokenInput } from "@/lib/security/tokens";
import { emailProvider } from "@/lib/email/provider";
import { sendConfirmationEmail } from "@/lib/email/newsletter";

export type NewsletterActionState = { ok: boolean; message: string };
const invalidToken: NewsletterActionState = { ok: false, message: "الرابط غير صالح أو استُخدم سابقًا." };

export async function subscribeNewsletterAction(_previous: NewsletterActionState, formData: FormData): Promise<NewsletterActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) || email.length > 320) return { ok: false, message: "أدخل بريدًا إلكترونيًا صحيحًا." };
  const confirmToken = createOpaqueToken();
  const unsubscribeToken = createOpaqueToken();
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("newsletter_subscribe", {
    p_email: email,
    p_source: "website",
    p_confirm_hash: hashToken(confirmToken),
    p_unsubscribe_hash: hashToken(unsubscribeToken),
  });
  if (error) {
    const message = error.message.includes("RATE_LIMITED") ? "محاولات كثيرة. حاول لاحقًا." : "تعذر تسجيل الاشتراك الآن.";
    return { ok: false, message };
  }
  const result = data as { status?: string; double_opt_in?: boolean } | null;
  if (result?.status === "unsubscribed" || result?.status === "bounced" || result?.status === "complained") return { ok: false, message: "هذا البريد غير متاح للاشتراك تلقائيًا. تواصل معنا إذا رغبت بإعادة التفعيل." };
  if (result?.double_opt_in) {
    if (!emailProvider.configured) return { ok: false, message: "تم تسجيل الطلب، لكن خدمة تأكيد البريد غير مهيأة بعد." };
    try {
      await sendConfirmationEmail(email, confirmToken);
      return { ok: true, message: "أرسلنا رسالة تأكيد إلى بريدك. افتحها لإكمال الاشتراك." };
    } catch {
      return { ok: false, message: "تم تسجيل الطلب لكن تعذر إرسال رسالة التأكيد. حاول لاحقًا." };
    }
  }
  return { ok: true, message: "تم الاشتراك بنجاح." };
}

export async function confirmNewsletterAction(_previous: NewsletterActionState, formData: FormData): Promise<NewsletterActionState> {
  const token = safeTokenInput(formData.get("token"));
  if (!token) return invalidToken;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("newsletter_confirm", { p_token_hash: hashToken(token) });
  if (error || data !== true) return invalidToken;
  return { ok: true, message: "تم تأكيد اشتراكك بنجاح." };
}

export async function unsubscribeNewsletterAction(_previous: NewsletterActionState, formData: FormData): Promise<NewsletterActionState> {
  const token = safeTokenInput(formData.get("token"));
  if (!token) return invalidToken;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("newsletter_unsubscribe", { p_token_hash: hashToken(token) });
  if (error || data !== true) return invalidToken;
  return { ok: true, message: "تم إلغاء الاشتراك. لن تصلك رسائل جديدة." };
}
