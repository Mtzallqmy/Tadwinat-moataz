"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import type { Category } from "@/types/content";
import { CategoryIcon } from "@/components/shared/category-icon";

const links = [["الرئيسية", "/"],["المقالات", "/posts"],["التدوينات", "/notes"],["اليوميات", "/diaries"],["الروابط", "/links"],["من أنا", "/about"]] as const;

export function MobileMenu({ categories }: { categories: Category[] }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild><button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card md:hidden" aria-label="فتح القائمة"><Menu className="size-5" aria-hidden="true" /></button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content dir="rtl" className="fixed inset-y-0 right-0 z-50 w-[min(88vw,390px)] overflow-y-auto border-l border-border bg-background p-5 shadow-[var(--shadow-float)]">
          <div className="flex items-center justify-between"><Dialog.Title className="text-lg font-black">القائمة</Dialog.Title><Dialog.Close className="grid size-10 place-items-center rounded-full border border-border" aria-label="إغلاق القائمة"><X className="size-5" aria-hidden="true" /></Dialog.Close></div>
          <nav className="mt-6 grid gap-1" aria-label="التنقل على الجوال">{links.map(([label, href]) => <Dialog.Close asChild key={href}><Link href={href} className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-accent">{label}</Link></Dialog.Close>)}</nav>
          <div className="mt-7 border-t border-border pt-6">
            <p className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">الأقسام</p>
            <div className="mt-3 grid grid-cols-2 gap-2">{categories.map((category) => <Dialog.Close asChild key={category.slug}><Link href={`/category/${category.slug}`} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold hover:border-primary/30 hover:bg-accent"><CategoryIcon name={category.icon} className="size-4 text-primary" />{category.name}</Link></Dialog.Close>)}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
