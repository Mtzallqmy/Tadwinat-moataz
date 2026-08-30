import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { saveAutomationRuleAction, toggleAutomationRuleAction } from "../actions";

export const dynamic = "force-dynamic";
const events = ["post.published","post.scheduled","post.failed","contact.received","newsletter.subscribed"];
const actions = ["telegram.notify_owner","telegram.post_channel","newsletter.send_article"];

export default async function AutomationsPage() {
  await requireCmsUser("settings.manage");
  const supabase = await createClient();
  const [{ data: rules }, { data: runs }] = await Promise.all([
    supabase.from("automation_rules").select("id,event,action,is_active,created_at").order("created_at", { ascending: false }),
    supabase.from("automation_runs").select("id,event,status,attempt_count,error_message,started_at,finished_at").order("started_at", { ascending: false }).limit(50),
  ]);
  return <div className="grid gap-6"><div><p className="text-sm font-bold text-primary">Automation</p><h1 className="mt-1 text-3xl font-black">القواعد وسجل التنفيذ</h1><p className="mt-2 text-sm text-muted-foreground">كل Rule/Event/Entity له مفتاح idempotency واحد، والفشل يتوقف بعد 3 محاولات.</p></div><section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">قاعدة جديدة</h2><form action={saveAutomationRuleAction} className="mt-4 grid gap-3 sm:grid-cols-3"><select name="event" className="h-11 rounded-xl border border-border bg-background px-3">{events.map((event)=><option key={event}>{event}</option>)}</select><select name="action" className="h-11 rounded-xl border border-border bg-background px-3">{actions.map((action)=><option key={action}>{action}</option>)}</select><button className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">إضافة</button></form><div className="mt-5 grid gap-2">{rules?.length ? rules.map((rule)=><div key={rule.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm"><b>{rule.event}</b><span>→</span><span>{rule.action}</span><span className="text-muted-foreground">{rule.is_active ? "نشطة" : "موقوفة"}</span><form action={toggleAutomationRuleAction} className="mr-auto"><input type="hidden" name="id" value={rule.id}/><input type="hidden" name="active" value={String(!rule.is_active)}/><button className="rounded-full border border-border px-3 py-1 text-xs font-bold">{rule.is_active ? "إيقاف" : "تفعيل"}</button></form></div>) : <p className="text-sm text-muted-foreground">لا توجد قواعد. لن تنفذ أي أتمتة حتى تضيف Rule صراحة.</p>}</div></section><section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">سجل التنفيذ</h2><div className="mt-4 grid gap-2">{runs?.length ? runs.map((run)=><div key={run.id} className="rounded-xl border border-border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{run.event}</b><span>{run.status} · محاولة {run.attempt_count}</span></div><p className="mt-1 text-xs text-muted-foreground">{run.started_at}{run.finished_at ? ` → ${run.finished_at}` : ""}</p>{run.error_message ? <p className="mt-1 text-xs text-destructive">{run.error_message}</p> : null}</div>) : <p className="text-sm text-muted-foreground">لا توجد عمليات بعد.</p>}</div></section></div>;
}
