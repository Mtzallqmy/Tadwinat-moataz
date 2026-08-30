import { createRedirectAction, deleteRedirectAction, toggleRedirectAction } from "@/app/admin/(cms)/redirects/actions";
import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const button = "min-h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold hover:bg-accent";

export default async function RedirectsPage() {
  await requireCmsUser("content.publish");
  const supabase = await createClient();
  const { data, error } = await supabase.from("redirects").select("id,source_path,destination_url,status_code,is_active,created_at").order("created_at", { ascending: false }).limit(250);
  if (error) throw new Error(`REDIRECTS_QUERY_FAILED: ${error.message}`);

  return (
    <div>
      <div><h1 className="text-2xl font-black">مدير التحويلات</h1><p className="mt-1 text-sm text-muted-foreground">تحويلات داخلية فقط لتجنب Open Redirects.</p></div>
      <form action={async (formData) => { "use server"; await createRedirectAction(formData); }} className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[1fr_1fr_120px_auto]">
        <input name="sourcePath" required placeholder="/old-path" className="admin-input" dir="ltr" />
        <input name="destinationUrl" required placeholder="/new-path" className="admin-input" dir="ltr" />
        <select name="statusCode" defaultValue="301" className="admin-input"><option value="301">301</option><option value="302">302</option><option value="307">307</option><option value="308">308</option></select>
        <button className="min-h-10 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">إضافة</button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/40 text-right"><tr><th className="p-3">المصدر</th><th className="p-3">الوجهة</th><th className="p-3">الكود</th><th className="p-3">الحالة</th><th className="p-3">إجراءات</th></tr></thead>
          <tbody>{(data ?? []).map((row) => <tr key={row.id} className="border-t border-border"><td className="p-3 font-mono text-xs" dir="ltr">{row.source_path}</td><td className="p-3 font-mono text-xs" dir="ltr">{row.destination_url}</td><td className="p-3">{row.status_code}</td><td className="p-3">{row.is_active ? "مفعّل" : "متوقف"}</td><td className="p-3"><div className="flex gap-2"><form action={async () => { "use server"; await toggleRedirectAction(row.id, !row.is_active); }}><button className={button}>{row.is_active ? "تعطيل" : "تفعيل"}</button></form><form action={async () => { "use server"; await deleteRedirectAction(row.id); }}><button className={button}>حذف</button></form></div></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
