import Link from "next/link";
import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { emailProvider } from "@/lib/email/provider";

export const dynamic = "force-dynamic";

function Status({ ok }: { ok: boolean }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"}`}>{ok ? "Configured" : "Not configured"}</span>; }

export default async function IntegrationsPage() {
  await requireCmsUser("settings.manage");
  const supabase = await createClient();
  const [{ data: settings }, { data: failedRuns }, { count: subscribers }, { count: messages }] = await Promise.all([
    supabase.from("site_settings").select("telegram_auto_post_enabled,telegram_notify_owner_enabled,newsletter_double_opt_in,newsletter_auto_send_new_posts,newsletter_sender_email").eq("id", true).single(),
    supabase.from("automation_runs").select("id,event,error_message,started_at").eq("status", "failed").order("started_at", { ascending: false }).limit(5),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET && process.env.TELEGRAM_OWNER_IDS);
  const channelConfigured = Boolean(process.env.TELEGRAM_CHANNEL_ID);
  return <div className="grid gap-6"><div><p className="text-sm font-bold text-primary">Integrations</p><h1 className="mt-1 text-3xl font-black">التكاملات والأتمتة</h1><p className="mt-2 text-sm text-muted-foreground">حالة تشغيلية فقط؛ لا تُعرض المفاتيح أو قيم الأسرار في هذه الصفحة.</p></div><div className="grid gap-4 md:grid-cols-3">
    <Link href="/admin/integrations/telegram" className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-black">Telegram</h2><Status ok={telegramConfigured}/></div><p className="mt-3 text-sm text-muted-foreground">القناة: {channelConfigured ? "Configured" : "Not configured"} · نشر تلقائي: {settings?.telegram_auto_post_enabled ? "مفعل" : "متوقف"}</p></Link>
    <Link href="/admin/integrations/newsletter" className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-black">Newsletter</h2><Status ok={emailProvider.configured && Boolean(settings?.newsletter_sender_email)}/></div><p className="mt-3 text-sm text-muted-foreground">مشتركون نشطون: {subscribers ?? 0} · Double opt-in: {settings?.newsletter_double_opt_in ? "مفعل" : "متوقف"}</p></Link>
    <Link href="/admin/integrations/automations" className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-black">Automation</h2><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold">Logs</span></div><p className="mt-3 text-sm text-muted-foreground">رسائل تواصل جديدة: {messages ?? 0} · نشر Newsletter تلقائي: {settings?.newsletter_auto_send_new_posts ? "مفعل" : "متوقف"}</p></Link>
  </div><section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">آخر أخطاء الأتمتة</h2>{failedRuns?.length ? <div className="mt-4 grid gap-3">{failedRuns.map((run)=><div key={run.id} className="rounded-xl border border-border p-3"><p className="text-sm font-bold">{run.event}</p><p className="mt-1 text-xs text-destructive">{run.error_message ?? "خطأ غير موصوف"}</p><p className="mt-1 text-[11px] text-muted-foreground">{run.started_at}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">لا توجد أخطاء مسجلة.</p>}</section></div>;
}
