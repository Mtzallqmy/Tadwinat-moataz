"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Category, ContentType, Post } from "@/types/content";
import { ArticleCard } from "@/components/blog/article-card";
import { StatePanel } from "@/components/shared/state-panels";

export function PostsExplorer({ posts, categories }: { posts: Post[]; categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState<ContentType | "all">("all");
  const [sort, setSort] = useState("newest");

  const result = useMemo(() => {
    const filtered = posts.filter((post) => {
      const q = query.trim();
      return (!q || `${post.title} ${post.excerpt}`.includes(q))
        && (category === "all" || post.category === category)
        && (type === "all" || post.contentType === type);
    });
    return [...filtered].sort((a, b) => sort === "popular"
      ? b.views - a.views
      : sort === "oldest"
        ? a.publishedAt.localeCompare(b.publishedAt)
        : b.publishedAt.localeCompare(a.publishedAt));
  }, [posts, query, category, type, sort]);

  return (
    <div>
      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-4 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <label className="relative">
          <span className="sr-only">البحث في المقالات</span>
          <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في المقالات..." className="h-11 w-full rounded-xl border border-border bg-background pr-11 pl-4 text-sm outline-none focus:border-primary" />
        </label>
        <Select value={category} onChange={setCategory} label="القسم" options={[["all","كل الأقسام"], ...categories.map((c) => [c.slug,c.name] as [string,string])]} />
        <Select value={type} onChange={(v) => setType(v as ContentType | "all")} label="النوع" options={[["all","كل الأنواع"],["article","مقالات"],["note","تدوينات"],["diary","يوميات"],["story","قصص"],["link","روابط"]]} />
        <Select value={sort} onChange={setSort} label="الترتيب" options={[["newest","الأحدث"],["oldest","الأقدم"],["popular","الأكثر قراءة"]]} />
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{result.length} نتيجة</p>
      {result.length ? <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{result.map((post) => <ArticleCard key={post.slug} post={post} />)}</div> : <div className="mt-5"><StatePanel variant="search" description="جرّب كلمة أخرى أو غيّر أحد عوامل التصفية." /></div>}
    </div>
  );
}

function Select({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: [string,string][] }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary">
        {options.map(([v,n]) => <option key={v} value={v}>{n}</option>)}
      </select>
    </label>
  );
}
