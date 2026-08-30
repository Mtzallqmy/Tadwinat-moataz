import { requireCmsUser } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function Status({ ok, label }: { ok: boolean; label: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-2 text-lg font-black ${ok ? "text-emerald-600" : "text-amber-600"}`}>{ok ? "سليم / مهيأ" : "يحتاج إعدادًا"}</p></div>;
}

export default async function SystemPage() {
  await requireCmsUser("settings.manage");
  const supabase = createAdminClient();
  const [database, storage, lastPublish, lastMaintenance, lastAutomationFailure] = await Promise.all([
    supabase.from("site_settings").select("id").eq("id", true).maybeSingle(),
    supabase.storage.listBuckets(),
    supabase.from("system_job_runs").select("status,finished_at,summary").eq("job_name", "publish").order("finished_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("system_job_runs").select("status,finished_at,summary").eq("job_name", "maintenance").order("finished_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("automation_runs").select("event,error_message,finished_at").eq("status", "failed").order("finished_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const storageOk = !storage.error && (storage.data ?? []).some((bucket) => bucket.id === "blog-media");
  return <main className="space-y-6"><div><p className="text-sm font-black text-primary">Production Operations</p><h1 className="mt-1 text-3xl font-black">حالة النظام</h1><p className="mt-2 text-sm text-muted-foreground">تعرض الحالة التشغيلية فقط دون إظهار أي مفاتيح أو أسرار.</p></div><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Status ok={!database.error && Boolean(database.data)} label="قاعدة البيانات"/><Status ok={storageOk} label="Storage / blog-media"/><Status ok={Boolean(process.env.CRON_SECRET)} label="Cron secret"/><Status ok={Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET)} label="Telegram"/><Status ok={Boolean(process.env.RESEND_API_KEY && process.env.NEWSLETTER_FROM)} label="Email / Resend"/><Status ok={Boolean(process.env.SUPABASE_SECRET_KEY)} label="Supabase server key"/></section><section className="grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-black">آخر Publish Job</h2><p className="mt-3 text-sm text-muted-foreground">{lastPublish.data ? `${lastPublish.data.status} — ${lastPublish.data.finished_at}` : "لا يوجد تشغيل مسجل بعد."}</p></div><div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-black">آخر Maintenance</h2><p className="mt-3 text-sm text-muted-foreground">{lastMaintenance.data ? `${lastMaintenance.data.status} — ${lastMaintenance.data.finished_at}` : "لا يوجد تشغيل مسجل بعد."}</p></div><div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-black">آخر Automation Failure</h2><p className="mt-3 text-sm text-muted-foreground">{lastAutomationFailure.data ? `${lastAutomationFailure.data.event} — ${lastAutomationFailure.data.finished_at ?? "غير مكتمل"}` : "لا توجد أخطاء مسجلة."}</p></div></section><section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-black">نسخة بيانات التطبيق</h2><p className="mt-2 text-sm text-muted-foreground">التصدير Owner-only ويشمل Posts/Categories/Tags/Settings فقط، ولا يشمل المشتركين أو الرسائل أو الأسرار.</p><a href="/api/admin/export" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">تنزيل JSON</a></section></main>;
}
