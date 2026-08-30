import Image from "next/image";
import Link from "next/link";
import { Clock3, Share2 } from "lucide-react";
import type { Post } from "@/types/content";
import { categoryBySlug } from "@/data/categories";
import { formatDate } from "@/lib/format";

export function ArticleCard({ post }: { post: Post }) {
  const category = categoryBySlug.get(post.category);
  return (
    <article className="group overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-card)]">
      <Link href={`/posts/${post.slug}`} className="block overflow-hidden">
        <Image
          src={post.cover}
          width={800}
          height={500}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
          className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.025]"
        />
      </Link>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/category/${post.category}`} className="text-xs font-bold text-primary hover:underline">
            {category?.name ?? "متنوع"}
          </Link>
          <Share2 className="size-4 text-muted-foreground" aria-label="مشاركة" />
        </div>
        <h3 className="mt-3 text-lg font-extrabold leading-8 tracking-tight">
          <Link href={`/posts/${post.slug}`} className="outline-none hover:text-primary focus-visible:underline">{post.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden="true" /> {post.readingMinutes} دقائق</span>
        </div>
      </div>
    </article>
  );
}
