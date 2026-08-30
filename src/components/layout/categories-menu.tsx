"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/types/content";
import { CategoryIcon } from "@/components/shared/category-icon";

export function CategoriesMenu({ categories }: { categories: Category[] }) {
  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        الأقسام
        <ChevronDown className="size-4" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={10} align="center" className="z-50 grid w-[min(620px,calc(100vw-2rem))] grid-cols-1 gap-1 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-float)] sm:grid-cols-2">
          {categories.map((category) => (
            <DropdownMenu.Item key={category.slug} asChild>
              <Link href={`/category/${category.slug}`} className="flex gap-3 rounded-xl p-3 outline-none transition hover:bg-accent focus:bg-accent">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CategoryIcon name={category.icon} className="size-[18px]" /></span>
                <span><span className="block text-sm font-bold">{category.name}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{category.description}</span></span>
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
