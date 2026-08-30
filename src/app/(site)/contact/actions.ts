"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { runAutomations } from "@/lib/automation/runner";

export type ContactActionState = { ok: boolean; message: string };

export async function submitContactAction(_previous: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "").trim();
  if (name.length < 1 || name.length > 120 || subject.length < 1 || subject.length > 240 || message.length < 1 || message.length > 10_000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return { ok: false, message: "تحقق من الاسم والبريد والموضوع والرسالة." };
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("contact_submit", { p_name: name, p_email: email, p_subject: subject, p_message: message, p_honeypot: honeypot });
  if (error) {
    if (error.message.includes("RATE_LIMITED")) return { ok: false, message: "تم تجاوز عدد المحاولات المسموح. حاول لاحقًا." };
    if (error.message.includes("SPAM_REJECTED")) return { ok: true, message: "تم استلام الرسالة." };
    return { ok: false, message: "تعذر إرسال الرسالة الآن. حاول لاحقًا." };
  }
  if (typeof data === "string") void runAutomations("contact.received", data, { source: "website" }).catch((automationError) => console.error("[automation] contact.received failed", automationError instanceof Error ? automationError.message : "unknown"));
  return { ok: true, message: "تم استلام رسالتك بنجاح." };
}
