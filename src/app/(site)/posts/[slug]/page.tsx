import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock3, Eye, UserRound } from "lucide-react";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleCard } from "@/components/blog/article-card";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareActions } from "@/components/blog/share-actions";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { Container } from "@/components/shared/container";
import { categoryBySlug } from "@/data/categories";
import { contentRepository } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";

export function generateStaticParams() {
  return contentRepository.getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = contentRepository.getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.cover] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = contentRepository.getPostBySlug(slug);
  if (!post) return notFound();

  const category = categoryBySlug.get(post.category);
  const all = contentRepository.getPosts();
  const index = all.findIndex((item) => item.slug === post.slug);
  const previous = index < all.length - 1 ? all[index + 1] : undefined;
  const next = index > 0 ? all[index - 1] : undefined;
  const related = contentRepository.getRelatedPosts(post.slug, post.category, 3);

  return (
    <main>
      <ReadingProgress />
      <Container className="pt-8 sm:pt-10">
        <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">الرئيسية</Link><ChevronLeft className="size-3.5" aria-hidden="true" />
          <Link href="/posts" className="hover:text-foreground">المقالات</Link><ChevronLeft className="size-3.5" aria-hidden="true" />
          <span aria-current="page" className="text-foreground">{post.title}</span>
        </nav>

        <div className="mx-auto mt-8 max-w-4xl text-center">
          <Link href={`/category/${post.category}`} className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">{category?.name ?? "متنوع"}</Link>
          <h1 className="mt-5 text-3xl font-black leading-[1.5] tracking-[-0.03em] sm:text-4xl lg:text-5xl">{post.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-9 text-muted-foreground sm:text-lg">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><UserRound className="size-4" /> معتز العلقمي</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {post.updatedAt ? <span>تحديث: {formatDate(post.updatedAt)}</span> : null}
            <span className="inline-flex items-center gap-1"><Clock3 className="size-4" /> {post.readingMinutes} دقائق</span>
            <span className="inline-flex items-center gap-1"><Eye className="size-4" /> {formatNumber(post.views)}</span>
          </div>
        </div>

        <div className="relative mx-auto mt-9 max-w-5xl overflow-hidden rounded-[calc(var(--radius-lg)+8px)] border border-border bg-card">
          <Image src={post.cover} width={1400} height={850} sizes="(max-width: 1100px) 100vw, 1100px" alt="" className="aspect-[16/9] w-full object-cover" priority />
        </div>
      </Container>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-7 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
          <TableOfContents />
          <article className="min-w-0">
            {post.slug === "slow-thinking-in-a-fast-world" ? (
              <ArticleBody />
            ) : (
              <div className="article-prose">
                <p className="lead">هذا محتوى تجريبي مخصص لاختبار قالب المقال في المرحلة الأولى، وليس النسخة التحريرية النهائية للمادة.</p>
                <h2 id="why-slow">مقدمة تجريبية</h2>
                <p>سيتم استبدال هذا النص بالمحتوى الفعلي عند ربط المنصة بنظام إدارة المحتوى في مرحلة لاحقة. الهدف الحالي هو اختبار القراءة الطويلة، التسلسل الهرمي للعناوين، عرض الصور، والتباعد.</p>
                <h2 id="attention">بنية المحتوى</h2>
                <p>يدعم القالب عناوين فرعية وفقرات وقوائم واقتباسات، مع عرض قراءة مريح لا يمتد بعرض الشاشة.</p>
                <h2 id="practice">ملاحظات المرحلة الأولى</h2>
                <p>لا تتضمن هذه النسخة أي ادعاءات طبية أو تحريرية نهائية. البيانات كلها Mock وموجودة خلف Data Access Layer قابلة للاستبدال.</p>
                <h2 id="closing">الخلاصة</h2>
                <p>قالب المقال جاهز لاستقبال البيانات الحقيقية بعد تصميم الـ Schema والـ CMS في المراحل التالية.</p>
              </div>
            )}

            <section className="mt-10 border-t border-border pt-7">
              <h2 className="text-sm font-black">المراجع</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">ستُضاف المراجع والمصادر الحقيقية عند تحرير ونشر كل مادة. هذا القسم Placeholder في المرحلة الأولى.</p>
            </section>

            <div className="mt-7 flex flex-wrap gap-2">
              {post.tags.map((tag) => <Link key={tag} href={`/tag/${tag}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/30 hover:bg-accent">#{tag}</Link>)}
            </div>

            <div className="mt-8"><ShareActions title={post.title} /></div>

            <section className="mt-12 rounded-[var(--radius-lg)] border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-black text-primary" aria-hidden="true">م</div>
                <div>
                  <p className="text-xs font-semibold text-primary">الكاتب</p>
                  <h2 className="mt-1 font-black">معتز العلقمي</h2>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">سيتم إضافة النبذة التعريفية الفعلية بعد تزويد المنصة بالمعلومات المناسبة للنشر.</p>
                </div>
              </div>
            </section>
          </article>
        </div>

        {related.length ? (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="text-2xl font-black">مقالات ذات صلة</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ArticleCard key={item.slug} post={item} />)}</div>
          </section>
        ) : null}

        <nav className="mt-12 grid gap-3 border-t border-border pt-8 sm:grid-cols-2" aria-label="المقال السابق والتالي">
          {previous ? <Link href={`/posts/${previous.slug}`} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30"><span className="text-xs text-muted-foreground">السابق</span><strong className="mt-1 block text-sm leading-7">{previous.title}</strong></Link> : <span />}
          {next ? <Link href={`/posts/${next.slug}`} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30"><span className="text-xs text-muted-foreground">التالي</span><strong className="mt-1 block text-sm leading-7">{next.title}</strong></Link> : null}
        </nav>
      </Container>
    </main>
  );
}
