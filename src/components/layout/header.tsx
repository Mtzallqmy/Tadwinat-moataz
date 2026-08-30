import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CategoriesMenu } from "@/components/layout/categories-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchDialog } from "@/components/layout/search-dialog";
import type { Category, Post } from "@/types/content";

const nav = [["الرئيسية", "/"],["المقالات", "/posts"],["التدوينات", "/notes"],["اليوميات", "/diaries"],["الروابط", "/links"]] as const;

export function Header({ categories, posts }: { categories: Category[]; posts: Post[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-[var(--container)] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="العودة إلى الرئيسية"><BrandMark /></Link>
        <nav className="mr-5 hidden items-center gap-0.5 xl:flex" aria-label="التنقل الرئيسي">
          {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground">{label}</Link>)}
          <CategoriesMenu categories={categories} />
          <Link href="/about" className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground">من أنا</Link>
        </nav>
        <div className="mr-auto flex items-center gap-2"><SearchDialog posts={posts} categories={categories} /><ThemeToggle /><MobileMenu categories={categories} /></div>
      </div>
    </header>
  );
}
