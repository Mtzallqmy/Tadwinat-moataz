import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { updateContactMessageStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  await requireCmsUser("settings.manage");
  const supabase = await createClient();
  const { data: messages } = await supabase.from("contact_messages").select("id,name,email,subject,message,status,created_at").order("created_at", { ascending: false }).limit(100);
  return <div className="grid gap-6"><div><p className="text-sm font-bold text-primary">Inbox</p><h1 className="mt-1 text-3xl font-black">رسائل التواصل</h1><p className="mt-2 text-sm text-muted-foreground">المحتوى هنا مدخل مستخدم غير موثوق ويُعرض كنص فقط.</p></div><div className="grid gap-4">{messages?.length ? messages.map((message)=><article key={message.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black">{message.subject}</h2><p className="mt-1 text-sm text-muted-foreground">{message.name} · {message.email} · {message.created_at}</p></div><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold">{message.status}</span></div><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{message.message}</p><form action={updateContactMessageStatusAction} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="id" value={message.id}/>{["new","read","replied","archived"].map((status)=><button key={status} name="status" value={status} disabled={message.status===status} className="rounded-full border border-border px-3 py-1.5 text-xs font-bold disabled:opacity-40">{status}</button>)}</form></article>) : <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">لا توجد رسائل بعد.</p>}</div></div>;
}
