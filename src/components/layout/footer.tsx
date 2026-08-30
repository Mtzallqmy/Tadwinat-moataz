import Link from "next/link";
import { Mail, Rss, Send } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-border bg-muted/35 pb-24 pt-12 md:pb-8">
      <div className="mx-auto grid max-w-[var(--container)] gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div><BrandMark /><p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">منصة شخصية للنشر والمعرفة والتدوين.</p></div>
        <FooterColumn title="روابط سريعة" links={[["من أنا","/about"],["المقالات","/posts"],["الأرشيف","/archive"],["تواصل","/contact"]]} />
        <FooterColumn title="الأقسام" links={[["طبي","/category/medical"],["صيدلاني","/category/pharmacy"],["ثقافي","/category/culture"],["لغوي","/category/language"],["ديني","/category/religion"],["فكري","/category/thought"]]} />
        <div>
          <h2 className="text-sm font-bold">تابعني</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Social href="/#newsletter" label="Telegram" Icon={Send} />
            <Link href="/#newsletter" aria-label="X" className="grid size-10 place-items-center rounded-full border border-border bg-background text-sm font-black hover:border-primary/30 hover:text-primary">𝕏</Link>
            <Social href="/contact" label="Email" Icon={Mail} />
            <Social href="/#newsletter" label="RSS" Icon={Rss} />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[var(--container)] flex-col gap-3 border-t border-border px-4 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {year} معتز العلقمي</p><div className="flex gap-4"><Link href="/privacy" className="hover:text-foreground">الخصوصية</Link><Link href="/disclaimer" className="hover:text-foreground">إخلاء المسؤولية</Link></div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div><h2 className="text-sm font-bold">{title}</h2><ul className="mt-4 grid gap-2.5 text-sm text-muted-foreground">{links.map(([label, href]) => <li key={href}><Link href={href} className="hover:text-foreground">{label}</Link></li>)}</ul></div>;
}

function Social({ href, label, Icon }: { href: string; label: string; Icon: typeof Mail }) {
  return <Link href={href} aria-label={label} className="grid size-10 place-items-center rounded-full border border-border bg-background hover:border-primary/30 hover:text-primary"><Icon className="size-[18px]" aria-hidden="true" /></Link>;
}
