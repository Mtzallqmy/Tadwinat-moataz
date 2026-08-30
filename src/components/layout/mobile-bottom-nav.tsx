import Link from "next/link";
import { Home, Layers3, Newspaper, Search, MoreHorizontal } from "lucide-react";

const items = [
  { href: "/", label: "الرئيسية", Icon: Home },
  { href: "/#categories", label: "الأقسام", Icon: Layers3 },
  { href: "/posts", label: "المقالات", Icon: Newspaper },
  { href: "/search", label: "بحث", Icon: Search },
  { href: "/about", label: "المزيد", Icon: MoreHorizontal },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-border bg-background/95 p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl md:hidden" aria-label="التنقل السفلي">
      {items.map(({ href, label, Icon }) => <Link key={href} href={href} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"><Icon className="size-[18px]" aria-hidden="true" />{label}</Link>)}
    </nav>
  );
}
