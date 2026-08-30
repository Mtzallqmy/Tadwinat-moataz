import Link from "next/link";
import { requireCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const staticPaths = new Set(["/", "/posts", "/notes", "/diaries", "/links", "/search", "/about", "/contact", "/privacy", "/disclaimer"]);

function internalPaths(html: string) {
  const values = new Set<string>();
  const matcher = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/giu;
  for (const match of html.matchAll(matcher)) {
    const href = match[1]?.trim();
    if (!href?.startsWith("/") || href.startsWith("//")) continue;
    const clean = href.split(/[?#]/u, 1)[0] || "/";
    values.add(clean);
  }
  return [...values];
}

export default async function BrokenLinksPage() {
  await requireCmsUser("content.read");
  const supabase = await createClient();
  const [postsResult, categoriesResult, tagsResult, redirectsResult] = await Promise.all([
    supabase.from("posts").select("id,title,slug,content_html").eq("status", "published").is("deleted_at", null).lte("published_at", new Date().toISOString()).limit(1000),
    supabase.from("categories").select("slug").eq("is_active", true).limit(1000),
    supabase.from("tags").select("slug").limit(1000),
    supabase.from("redirects").select("source_path").eq("is_active", true).limit(1000),
  ]);
  for (const result of [postsResult, categoriesResult, tagsResult, redirectsResult]) {
    if (result.error) throw new Error(`LINK_AUDIT_QUERY_FAILED: ${result.error.message}`);
  }

  const posts = postsResult.data ?? [];
  const valid = new Set(staticPaths);
  posts.forEach((post) => valid.add(`/posts/${post.slug}`));
  (categoriesResult.data ?? []).forEach((category) => valid.add(`/category/${category.slug}`));
  (tagsResult.data ?? []).forEach((tag) => valid.add(`/tag/${tag.slug}`));
  (redirectsResult.data ?? []).forEach((redirect) => valid.add(redirect.source_path));

  const broken = posts.flatMap((post) => internalPaths(post.content_html ?? "")
    .filter((path) => !valid.has(path))
    .map((path) => ({ postId: post.id, title: post.title, slug: post.slug, path })));

  return (
    <div>
      <h1 className="text-2xl font-black">فحص الروابط الداخلية</h1>
      <p className="mt-1 text-sm text-muted-foreground">تحليل محلي للمحتوى المنشور فقط؛ لا يتم جلب أي URL خارجي.</p>
      <div className="mt-5 rounded-2xl border border-border bg-card p-5"><p className="text-sm font-bold">الروابط المكسورة المكتشفة: <span className="text-xl font-black">{broken.length}</span></p></div>
      <div className="mt-5 grid gap-3">{broken.slice(0, 500).map((item) => <article key={`${item.postId}:${item.path}`} className="rounded-2xl border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-black">{item.title}</h2><p className="mt-1 font-mono text-xs text-destructive" dir="ltr">{item.path}</p></div><div className="flex gap-3"><Link href={`/posts/${item.slug}`} target="_blank" className="text-xs font-bold">فتح</Link><Link href={`/admin/content/${item.postId}/edit`} className="text-xs font-black text-primary">تحرير</Link></div></div></article>)}{!broken.length ? <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">لم يُكتشف رابط داخلي مكسور في المحتوى المنشور.</p> : null}</div>
    </div>
  );
}
