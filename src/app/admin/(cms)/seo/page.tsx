import Link from "next/link";
import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SeoDashboardPage() {
  await requireCmsUser("content.read");
  const supabase = await createClient();
  const [{ data: posts, error: postsError }, { count: redirectsCount, error: redirectsError }] = await Promise.all([
    supabase.from("posts").select("id,title,slug,status,seo_title,seo_description,cover_image_id,robots_index,published_at").is("deleted_at", null).limit(1000),
    supabase.from("redirects").select("id", { count: "exact", head: true }),
  ]);
  if (postsError) throw new Error(`SEO_POSTS_QUERY_FAILED: ${postsError.message}`);
  if (redirectsError) throw new Error(`SEO_REDIRECTS_QUERY_FAILED: ${redirectsError.message}`);

  const rows = posts ?? [];
  const published = rows.filter((post) => post.status === "published");
  const missingTitle = published.filter((post) => !post.seo_title?.trim()).length;
  const missingDescription = published.filter((post) => !post.seo_description?.trim()).length;
  const missingCover = published.filter((post) => !post.cover_image_id).length;
  const noIndexPublished = published.filter((post) => post.robots_index === false).length;

  const cards = [
    ["المنشور", published.length],
    ["بلا SEO Title", missingTitle],
    ["بلا Meta Description", missingDescription],
    ["بلا غلاف", missingCover],
    ["منشور noindex", noIndexPublished],
    ["التحويلات", redirectsCount ?? 0],
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-black">SEO وGEO</h1><p className="mt-1 text-sm text-muted-foreground">قياسات فعلية من المحتوى الحالي، دون درجات وهمية.</p></div><div className="flex gap-2"><Link href="/admin/redirects" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold">التحويلات</Link><Link href="/admin/tools/links" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold">فحص الروابط</Link></div></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-bold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>)}</div>
      <section className="mt-6 rounded-2xl border border-border bg-card p-5"><h2 className="font-black">المحتوى الذي يحتاج مراجعة</h2><div className="mt-4 grid gap-2">{published.filter((post) => !post.seo_title?.trim() || !post.seo_description?.trim() || !post.cover_image_id || post.robots_index === false).slice(0, 100).map((post) => <div key={post.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"><div><p className="text-sm font-bold">{post.title}</p><p className="mt-1 text-xs text-muted-foreground">{[!post.seo_title?.trim() ? "SEO Title" : null, !post.seo_description?.trim() ? "Meta" : null, !post.cover_image_id ? "Cover" : null, post.robots_index === false ? "noindex" : null].filter(Boolean).join(" · ")}</p></div><Link href={`/admin/content/${post.id}/edit`} className="text-xs font-black text-primary">تحرير</Link></div>)}{!published.length ? <p className="text-sm text-muted-foreground">لا يوجد محتوى منشور بعد.</p> : null}</div></section>
    </div>
  );
}
