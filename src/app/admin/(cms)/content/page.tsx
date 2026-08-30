import Link from "next/link";
import { requireCmsUser } from "@/lib/auth/authorization";
import { postsRepository } from "@/lib/repositories/posts";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireCmsUser("content.read");
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const status = one(params.status);
  const type = one(params.type);
  const search = one(params.q);
  const page = await postsRepository.listAdmin({ status, type, search, pageSize: 50 });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-black">المحتوى</h1><p className="mt-1 text-sm text-muted-foreground">{page.count} عنصر</p></div>
        <Link href="/admin/content/new" className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">محتوى جديد</Link>
      </div>
      <form className="mt-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={search} placeholder="بحث بالعنوان" className="admin-input max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="admin-input max-w-40"><option value="">كل الحالات</option><option value="draft">مسودة</option><option value="review">مراجعة</option><option value="scheduled">مجدول</option><option value="published">منشور</option><option value="archived">مؤرشف</option></select>
        <select name="type" defaultValue={type ?? ""} className="admin-input max-w-40"><option value="">كل الأنواع</option><option value="article">مقال</option><option value="note">تدوينة</option><option value="diary">يومية</option><option value="story">قصة</option><option value="link">رابط</option><option value="page">صفحة</option></select>
        <button className="min-h-10 rounded-xl border border-border bg-background px-4 text-sm font-bold">تصفية</button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/40 text-right"><tr><th className="p-3">العنوان</th><th className="p-3">النوع</th><th className="p-3">الحالة</th><th className="p-3">آخر تحديث</th><th className="p-3"><span className="sr-only">إجراء</span></th></tr></thead>
          <tbody>{page.posts.map((post) => <tr key={post.id} className="border-t border-border"><td className="p-3 font-bold">{post.title}</td><td className="p-3">{post.contentType}</td><td className="p-3"><span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">{post.status}</span></td><td className="p-3 text-muted-foreground">{post.updatedAt ? new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.updatedAt)) : "—"}</td><td className="p-3"><Link href={`/admin/content/${post.id}/edit`} className="font-bold text-primary">تحرير</Link></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
