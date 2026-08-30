import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3, Eye, Share2 } from "lucide-react";
import type { Post } from "@/types/content";
import { categoryBySlug } from "@/data/categories";
import { formatDate, formatNumber } from "@/lib/format";

export function FeaturedPost({ post }: { post: Post }) {
  const category = categoryBySlug.get(post.category);
  return (
    <article className="grid overflow-hidden rounded-[calc(var(--radius-lg)+6px)] border border-border bg-card shadow-[var(--shadow-soft)] lg:grid-cols-[1.15fr_.85fr]">
      <div className="relative min-h-[280px] overflow-hidden lg:min-h-[430px]">
        <Image src={post.cover} fill sizes="(max-width: 1024px) 100vw, 60vw" alt="" className="object-cover" priority />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <span className="rounded-full bg-primary/10 px-3 py-1.5">{category?.name ?? "فكري"}</span>
          <span className="text-muted-foreground">مقال مميز</span>
        </div>
        <h2 className="mt-5 text-2xl font-black leading-[1.5] tracking-tight sm:text-3xl">{post.title}</h2>
        <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {post.readingMinutes} دقائق</span>
          <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {formatNumber(post.views)} مشاهدة</span>
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          <Link href={`/posts/${post.slug}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            اقرأ المقال <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link href={`/posts/${post.slug}#share`} className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-bold hover:bg-accent">
            <Share2 className="size-4" aria-hidden="true" /> مشاركة
          </Link>
        </div>
      </div>
    </article>
  );
}
