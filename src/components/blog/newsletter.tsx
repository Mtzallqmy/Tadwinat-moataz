"use client";

import { useActionState } from "react";
import { Rss, Send } from "lucide-react";
import { subscribeNewsletterAction, type NewsletterActionState } from "@/app/(site)/newsletter/actions";

const initialState: NewsletterActionState = { ok: false, message: "" };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, initialState);
  return (
    <section id="newsletter" className="overflow-hidden rounded-[calc(var(--radius-lg)+8px)] border border-primary/15 bg-[linear-gradient(135deg,var(--accent),var(--card))] p-6 sm:p-10">
      <div className="grid gap-7 lg:grid-cols-[1fr_.9fr] lg:items-end">
        <div>
          <p className="text-sm font-bold text-primary">النشرة والروابط</p>
          <h2 className="mt-2 text-3xl font-black">ابقَ قريبًا</h2>
          <p className="mt-3 max-w-xl text-sm leading-8 text-muted-foreground">اشترك ليصلك جديد المقالات والتدوينات والروابط المختارة. يمكنك إلغاء الاشتراك من أي رسالة.</p>
          <div className="mt-5 flex gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2"><Send className="size-4" /> Telegram</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2"><Rss className="size-4" /> RSS</span>
          </div>
        </div>
        <form action={action} className="grid gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">بريدك الإلكتروني</label>
            <input id="newsletter-email" name="email" type="email" required autoComplete="email" maxLength={320} placeholder="بريدك الإلكتروني" className="h-12 min-w-0 flex-1 rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            <button type="submit" disabled={pending} className="h-12 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-70">{pending ? "جارٍ التسجيل…" : "اشتراك"}</button>
          </div>
          <p aria-live="polite" className={`min-h-5 text-xs ${state.message ? (state.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive") : "text-muted-foreground"}`}>{state.message || "نستخدم بريدك للنشرة فقط وفق سياسة الخصوصية."}</p>
        </form>
      </div>
    </section>
  );
}
