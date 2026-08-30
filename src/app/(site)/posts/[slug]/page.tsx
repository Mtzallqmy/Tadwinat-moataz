import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft,Clock3,UserRound } from "lucide-react";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleCard } from "@/components/blog/article-card";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareActions } from "@/components/blog/share-actions";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { Container } from "@/components/shared/container";
import { postsRepository } from "@/lib/repositories/posts";
import { settingsRepository } from "@/lib/repositories/settings";
import { buildPostMetadata } from "@/lib/seo/metadata";
import { buildArticleSchema,buildBreadcrumbSchema,buildFaqSchema,buildWebPageSchema,serializeJsonLd } from "@/lib/seo/structured-data";
import { getCanonicalPostUrl } from "@/lib/site/url";
import { formatDate } from "@/lib/format";

export const revalidate=300;
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const [post,settings]=await Promise.all([postsRepository.getPublishedBySlug(slug),settingsRepository.getPublic()]);return post?buildPostMetadata(post,settings):{};}
function showUpdated(published:string,updated?:string){return updated?new Date(updated).getTime()-new Date(published).getTime()>12*60*60*1000:false;}
export default async function PostPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const [post,settings]=await Promise.all([postsRepository.getPublishedBySlug(slug),settingsRepository.getPublic()]); if(!post)return notFound();
  const related=post.id?await postsRepository.getRelated(post.id,3):[]; const canonical=getCanonicalPostUrl(post.slug,post.canonicalUrl,settings.siteUrl);
  const schemas=[buildWebPageSchema(post,settings),buildArticleSchema(post,settings),buildBreadcrumbSchema([{name:"الرئيسية",path:"/"},{name:post.categoryName||post.category,path:`/category/${post.category}`},{name:post.title,path:`/posts/${post.slug}`}],settings)]; const faq=buildFaqSchema(post); if(faq)schemas.push(faq);
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(schemas)}}/><ReadingProgress/><Container className="pt-8 sm:pt-10">
    <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><Link href="/">الرئيسية</Link><ChevronLeft className="size-3.5" aria-hidden="true"/><Link href={`/category/${post.category}`}>{post.categoryName||post.category}</Link><ChevronLeft className="size-3.5" aria-hidden="true"/><span aria-current="page" className="text-foreground">{post.title}</span></nav>
    <header className="mx-auto mt-8 max-w-4xl text-center"><Link href={`/category/${post.category}`} className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">{post.categoryName||post.category}</Link><h1 className="mt-5 text-3xl font-black leading-[1.5] tracking-[-0.03em] sm:text-4xl lg:text-5xl">{post.title}</h1><p className="mx-auto mt-5 max-w-3xl text-base leading-9 text-muted-foreground sm:text-lg">{post.excerpt}</p><div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><UserRound className="size-4"/>{post.author?.name||settings.authorName}</span><span>نشر في <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>{showUpdated(post.publishedAt,post.updatedAt)?<span>آخر تحديث <time dateTime={post.updatedAt}>{formatDate(post.updatedAt!)}</time></span>:null}<span className="inline-flex items-center gap-1"><Clock3 className="size-4"/>{post.readingMinutes} دقائق · {post.wordCount??0} كلمة</span></div></header>
    <figure className="relative mx-auto mt-9 max-w-5xl overflow-hidden rounded-[calc(var(--radius-lg)+8px)] border border-border bg-card"><Image src={post.cover} width={1400} height={850} sizes="(max-width: 1100px) 100vw, 1100px" alt={post.coverAlt||post.title} className="aspect-[16/9] w-full object-cover" priority/></figure>
  </Container><Container className="py-10 sm:py-14"><div className="grid gap-7 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12"><TableOfContents/><article className="min-w-0">
    {post.summary?<section className="mb-8 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5"><h2 className="text-base font-black">الخلاصة</h2><p className="mt-2 leading-8 text-muted-foreground">{post.summary}</p></section>:null}
    {post.keyPoints?.length?<section className="mb-8"><h2 className="text-lg font-black">أهم النقاط</h2><ul className="mt-3 list-disc space-y-2 pr-5 text-sm leading-8">{post.keyPoints.map((point)=><li key={point}>{point}</li>)}</ul></section>:null}
    {post.contentHtml?<div className="article-prose" dangerouslySetInnerHTML={{__html:post.contentHtml}}/>:post.slug==="slow-thinking-in-a-fast-world"?<ArticleBody/>:<p className="article-prose">{post.excerpt}</p>}
    {post.faqs?.length?<section className="mt-10 border-t border-border pt-7"><h2 className="text-xl font-black">أسئلة شائعة</h2><div className="mt-4 grid gap-3">{post.faqs.map((faq)=><details key={faq.id||faq.question} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-bold">{faq.question}</summary><p className="mt-3 text-sm leading-8 text-muted-foreground">{faq.answer}</p></details>)}</div></section>:null}
    {post.references?.length?<section className="mt-10 border-t border-border pt-7"><h2 className="text-xl font-black">المراجع والمصادر</h2><ol className="mt-4 list-decimal space-y-3 pr-5 text-sm leading-7">{post.references.map((ref)=><li key={ref.id||`${ref.title}-${ref.url}`}><span className="font-bold">{ref.title}</span>{ref.author?` — ${ref.author}`:""}{ref.publisher?`، ${ref.publisher}`:""}{ref.url?<><br/><a href={ref.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">{ref.url}</a></>:null}</li>)}</ol></section>:null}
    <div className="mt-7 flex flex-wrap gap-2">{post.tags.map((tag)=><Link key={tag} href={`/tag/${tag}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">#{tag}</Link>)}</div><div className="mt-8"><ShareActions title={post.title} canonicalUrl={canonical}/></div>
  </article></div>{related.length?<section className="mt-16 border-t border-border pt-10"><h2 className="text-2xl font-black">مقالات ذات صلة</h2><div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{related.map((item)=><ArticleCard key={item.slug} post={item}/>)}</div></section>:null}</Container></main>;
}
