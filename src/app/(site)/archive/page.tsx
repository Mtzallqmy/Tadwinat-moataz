import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";

export const metadata: Metadata = { title: "الأرشيف" };

const months = [
  { name: "أغسطس", count: 9, href: "/posts" },
  { name: "يوليو", count: 3, href: "/posts" },
  { name: "يونيو", count: 0, href: "/posts" },
];

export default function ArchivePage() {
  return (
    <main>
      <PageIntro eyebrow="زمنيًا" title="الأرشيف" description="استعرض المحتوى حسب السنة والشهر." />
      <Container className="py-10 sm:py-12">
        <section className="max-w-2xl rounded-[var(--radius-lg)] border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span>
            <h2 className="text-2xl font-black">2026</h2>
          </div>
          <div className="mt-5 divide-y divide-border border-r border-border pr-5">
            {months.map((month) => (
              <Link key={month.name} href={month.href} className="flex items-center justify-between py-4 text-sm hover:text-primary">
                <span className="font-bold">{month.name}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{month.count} منشورات</span>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
