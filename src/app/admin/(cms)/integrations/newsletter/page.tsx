import Link from "next/link";
import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { emailProvider } from "@/lib/email/provider";
import { saveNewsletterSettingsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewsletterIntegrationPage() {
  await requireCmsUser("settings.manage");
  const supabase = await createClient();
  const [{ data: settings }, { count: pending }, { count: active }, { count: unsubscribed }] = await Promise.all([
    supabase.from("site_settings").select("newsletter_double_opt_in,newsletter_auto_send_new_posts,newsletter_sender_name,newsletter_sender_email,newsletter_reply_to,newsletter_footer").eq("id", true).single(),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "unsubscribed"),
  ]);
  return <div className="grid gap-6"><div><p className="text-sm font-bold text-primary">Newsletter</p><h1 className="mt-1 text-3xl font-black">إعدادات البريد</h1><p className="mt-2 text-sm text-muted-foreground">Resend: <b>{emailProvider.configured ? "Configured" : "Not configured"}</b> · Active {active ?? 0} · Pending {pending ?? 0} · Unsubscribed {unsubscribed ?? 0}</p></div><section className="rounded-2xl border border-border bg-card p-5"><form action={saveNewsletterSettingsAction} className="grid gap-4 md:grid-cols-2"><label className="grid gap-1 text-sm font-bold">اسم المرسل<input name="senderName" defaultValue={settings?.newsletter_sender_name ?? ""} className="h-11 rounded-xl border border-border bg-background px-3 font-normal"/></label><label className="grid gap-1 text-sm font-bold">بريد المرسل<input name="senderEmail" type="email" defaultValue={settings?.newsletter_sender_email ?? ""} placeholder="newsletter@example.com" className="h-11 rounded-xl border border-border bg-background px-3 font-normal"/></label><label className="grid gap-1 text-sm font-bold">Reply-To<input name="replyTo" type="email" defaultValue={settings?.newsletter_reply_to ?? ""} className="h-11 rounded-xl border border-border bg-background px-3 font-normal"/></label><label className="flex items-center gap-2 self-end pb-3 text-sm font-bold"><input name="doubleOptIn" type="checkbox" defaultChecked={settings?.newsletter_double_opt_in}/> Double opt-in</label><label className="flex items-center gap-2 text-sm font-bold"><input name="autoSend" type="checkbox" defaultChecked={settings?.newsletter_auto_send_new_posts}/> السماح بأتمتة حملات المقالات الجديدة</label><label className="grid gap-1 text-sm font-bold md:col-span-2">تذييل الرسائل<textarea name="footer" rows={3} maxLength={1000} defaultValue={settings?.newsletter_footer ?? ""} className="rounded-xl border border-border bg-background p-3 font-normal"/></label><button className="h-11 w-fit rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground">حفظ الإعدادات</button></form></section><Link href="/admin/newsletter" className="w-fit rounded-full border border-border px-5 py-2.5 text-sm font-bold">إدارة الحملات →</Link></div>;
}
