import Link from "next/link";
import type { Category } from "@/types/content";
import { CategoryIcon } from "@/components/shared/category-icon";
import { formatNumber } from "@/lib/format";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/category/${category.slug}`} className="group rounded-[var(--radius-lg)] border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CategoryIcon name={category.icon} className="size-5" />
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{formatNumber(category.count)} مقالًا</span>
      </div>
      <h3 className="mt-4 font-extrabold group-hover:text-primary">{category.name}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{category.description}</p>
    </Link>
  );
}
