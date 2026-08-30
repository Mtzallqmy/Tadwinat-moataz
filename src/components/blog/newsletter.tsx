import { Rss, Send } from "lucide-react";

export function Newsletter() {
  return (
    <section id="newsletter" className="overflow-hidden rounded-[calc(var(--radius-lg)+8px)] border border-primary/15 bg-[linear-gradient(135deg,var(--accent),var(--card))] p-6 sm:p-10">
      <div className="grid gap-7 lg:grid-cols-[1fr_.9fr] lg:items-end">
        <div>
          <p className="text-sm font-bold text-primary">النشرة والروابط</p>
          <h2 className="mt-2 text-3xl font-black">ابقَ قريبًا</h2>
          <p className="mt-3 max-w-xl text-sm leading-8 text-muted-foreground">اشترك ليصلك جديد المقالات والتدوينات والروابط المختارة.</p>
          <div className="mt-5 flex gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2"><Send className="size-4" /> Telegram</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2"><Rss className="size-4" /> RSS</span>
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">بريدك الإلكتروني</label>
            <input id="newsletter-email" type="email" disabled placeholder="بريدك الإلكتروني" className="h-12 min-w-0 flex-1 rounded-full border border-border bg-background px-5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-80" />
            <button type="button" disabled className="h-12 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70">اشتراك — قريبًا</button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">واجهة تجريبية في المرحلة الأولى، وسيتم ربطها لاحقًا بنظام النشرة.</p>
        </div>
      </div>
    </section>
  );
}
