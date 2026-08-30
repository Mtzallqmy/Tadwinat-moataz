import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireCmsUser("audit.read");
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: events }, { count: published }, { count: activeSubscribers }] = await Promise.all([
    supabase.from("analytics_events").select("event_name,entity_id,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published").lte("published_at", new Date().toISOString()).is("deleted_at", null),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const counts = new Map<string, number>();
  const shares = new Map<string, number>();
  for (const event of events ?? []) {
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1);
    if (event.event_name === "share_click" && event.entity_id) shares.set(event.entity_id, (shares.get(event.entity_id) ?? 0) + 1);
  }
  const topIds = [...shares.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id])=>id);
  const { data: topPosts } = topIds.length ? await supabase.from("posts").select("id,title,slug").in("id", topIds) : { data: [] as Array<{id:string;title:string;slug:string}> };
  const postMap = new Map((topPosts ?? []).map((post)=>[post.id,post]));
  return <div className="grid gap-6"><div><p className="text-sm font-bold text-primary">Analytics</p><h1 className="mt-1 text-3xl font-black">تحليلات داخلية بسيطة</h1><p className="mt-2 text-sm text-muted-foreground">آخر 30 يومًا. لا توجد أرقام تجريبية؛ المعروض يأتي من الأحداث المخزنة فقط.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["المحتوى المنشور",published??0],["المشتركون النشطون",activeSubscribers??0],["مشاركات",counts.get("share_click")??0],["عمليات بحث",counts.get("search_submit")??0]].map(([label,value])=><div key={String(label)} className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div><section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">الأحداث</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([name,count])=><div key={name} className="flex justify-between rounded-xl border border-border p-3 text-sm"><span>{name}</span><b>{count}</b></div>)}</div></section><section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">الأكثر مشاركة</h2><div className="mt-4 grid gap-2">{topIds.length ? topIds.map((id)=><div key={id} className="flex justify-between rounded-xl border border-border p-3 text-sm"><span>{postMap.get(id)?.title ?? id}</span><b>{shares.get(id) ?? 0}</b></div>) : <p className="text-sm text-muted-foreground">لا توجد بيانات مشاركة بعد.</p>}</div></section></div>;
}
