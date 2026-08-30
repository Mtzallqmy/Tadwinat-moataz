import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/types/content";
import { formatDate } from "@/lib/format";

export function CompactPostList({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <article key={post.slug} className="grid grid-cols-[104px_1fr] gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-3 sm:grid-cols-[150px_1fr]">
          <Link href={`/posts/${post.slug}`} className="overflow-hidden rounded-xl">
            <Image src={post.cover} width={320} height={220} sizes="150px" alt="" className="h-full min-h-[100px] w-full object-cover" />
          </Link>
          <div className="py-1">
            <time className="text-[11px] text-muted-foreground" dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <h3 className="mt-1.5 font-extrabold leading-7"><Link href={`/posts/${post.slug}`} className="hover:text-primary">{post.title}</Link></h3>
            <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">{post.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
