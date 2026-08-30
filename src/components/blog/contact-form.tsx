"use client";

import { useActionState } from "react";
import { submitContactAction, type ContactActionState } from "@/app/(site)/contact/actions";

const initialState: ContactActionState = { ok: false, message: "" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactAction, initialState);
  return (
    <form action={action} className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-border bg-card p-5 sm:p-7">
      <div className="grid gap-5">
        <label htmlFor="contact-name" className="grid gap-2 text-sm font-bold">الاسم<input id="contact-name" name="name" type="text" required maxLength={120} autoComplete="name" className="h-12 rounded-xl border border-border bg-background px-4 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
        <label htmlFor="contact-email" className="grid gap-2 text-sm font-bold">البريد<input id="contact-email" name="email" type="email" required maxLength={320} autoComplete="email" className="h-12 rounded-xl border border-border bg-background px-4 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
        <label htmlFor="contact-subject" className="grid gap-2 text-sm font-bold">الموضوع<input id="contact-subject" name="subject" type="text" required maxLength={240} className="h-12 rounded-xl border border-border bg-background px-4 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
        <label htmlFor="contact-message" className="grid gap-2 text-sm font-bold">الرسالة<textarea id="contact-message" name="message" required maxLength={10000} rows={7} className="resize-y rounded-xl border border-border bg-background p-4 font-normal leading-7 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
        <label className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">الموقع<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <button type="submit" disabled={pending} className="mt-6 h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-65">{pending ? "جارٍ الإرسال…" : "إرسال الرسالة"}</button>
      <p aria-live="polite" className={`mt-3 min-h-5 text-sm ${state.message ? (state.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive") : "text-muted-foreground"}`}>{state.message || "لن نستخدم بريدك إلا للرد على هذه الرسالة."}</p>
    </form>
  );
}
