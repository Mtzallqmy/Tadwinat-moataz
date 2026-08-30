"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContentType, Post } from "@/types/content";
import { ArticleCard } from "@/components/blog/article-card";
import { StatePanel } from "@/components/shared/state-panels";

const filters: { value: ContentType | "all"; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "article", label: "مقالات" },
  { value: "note", label: "تدوينات" },
  { value: "diary", label: "يوميات" },
  { value: "link", label: "روابط" },
];

export function SearchWorkspace({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ContentType | "all">("all");

  const result = useMemo(() => posts.filter((post) => {
    const q = query.trim();
    return (!q || `${post.title} ${post.excerpt}`.includes(q)) && (type === "all" || post.contentType === type);
  }), [posts, query, type]);

  return (
    <div>
      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 sm:p-6">
        <label className="relative block">
          <span className="sr-only">ابحث في معتز العلقمي</span>
          <Search className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في معتز العلقمي" className="h-14 w-full rounded-2xl border border-border bg-background pr-12 pl-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </label>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="تصفية نتائج البحث">
          {filters.map((filter) => (
            <button key={filter.value} type="button" onClick={() => setType(filter.value)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${type === filter.value ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-accent"}`}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      {result.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{result.map((post) => <ArticleCard key={post.slug} post={post} />)}</div> : <div className="mt-6"><StatePanel variant="search" description="لم نعثر على محتوى مطابق. جرّب صياغة أقصر أو غيّر نوع المحتوى." /></div>}
    </div>
  );
}
