import Link from "next/link";
import type { PopularPost } from "@/types/content";
import { categoryBySlug } from "@/data/categories";
import { formatNumber } from "@/lib/format";

export function PopularList({ posts }: { posts: PopularPost[] }) {
  return (
    <ol className="divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-card px-5">
      {posts.map((post, index) => (
        <li key={post.slug} className="grid grid-cols-[42px_1fr] gap-4 py-5">
          <span className="text-2xl font-black tracking-tighter text-border">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <Link href={`/posts/${post.slug}`} className="font-extrabold leading-7 hover:text-primary">{post.title}</Link>
            <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
              <span>{categoryBySlug.get(post.category)?.name}</span>
              <span>{formatNumber(post.views)} مشاهدة</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
