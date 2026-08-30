"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, Clock3, Layers3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Category, Post } from "@/types/content";

export function SearchDialog({ posts, categories }: { posts: Post[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, []);
  const results = useMemo(() => { const value = query.trim(); if (!value) return posts.slice(0, 4); return posts.filter((post) => `${post.title} ${post.excerpt}`.includes(value)).slice(0, 6); }, [posts, query]);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><button type="button" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm text-muted-foreground transition hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="فتح البحث"><Search className="size-[18px]" aria-hidden="true" /><span className="hidden lg:inline">بحث</span><kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] lg:inline">⌘K</kbd></button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content dir="rtl" className="fixed left-1/2 top-[10vh] z-50 w-[min(680px,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-border bg-popover shadow-[var(--shadow-float)]">
          <Dialog.Title className="sr-only">البحث السريع</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-border px-4"><Search className="size-5 text-muted-foreground" aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في معتز العلقمي..." className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" /><Dialog.Close className="grid size-9 place-items-center rounded-full hover:bg-accent" aria-label="إغلاق البحث"><X className="size-5" aria-hidden="true" /></Dialog.Close></div>
          <div className="max-h-[65vh] overflow-y-auto p-3">
            <div className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-muted-foreground"><Clock3 className="size-4" aria-hidden="true" />{query ? "نتائج مقترحة" : "مقترحات للقراءة"}</div>
            <div className="grid gap-1">{results.length ? results.map((post) => <Dialog.Close asChild key={post.slug}><Link href={`/posts/${post.slug}`} className="rounded-xl px-3 py-3 hover:bg-accent focus:bg-accent"><span className="block text-sm font-bold">{post.title}</span><span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">{post.excerpt}</span></Link></Dialog.Close>) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>}</div>
            <div className="mt-3 border-t border-border pt-3"><div className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-muted-foreground"><Layers3 className="size-4" aria-hidden="true" />الأقسام</div><div className="flex flex-wrap gap-2 px-2 pb-2">{categories.slice(0, 6).map((category) => <Dialog.Close asChild key={category.slug}><Link href={`/category/${category.slug}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary/30 hover:bg-accent">{category.name}</Link></Dialog.Close>)}</div></div>
          </div>
          <div className="border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">اختصار البحث: Ctrl + K أو ⌘ + K</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
