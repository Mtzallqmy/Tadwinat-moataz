import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DiaryEntry } from "@/types/content";
import { formatDate } from "@/lib/format";

export function DiaryTimeline({ entries }: { entries: DiaryEntry[] }) {
  return (
    <div className="relative border-r border-border pr-6">
      {entries.map((entry) => (
        <article key={entry.id} className="relative pb-8 last:pb-0">
          <span className="absolute -right-[29px] top-2 size-2.5 rounded-full border-2 border-background bg-primary shadow-[0_0_0_3px_var(--border)]" />
          <time className="text-xs font-semibold text-primary" dateTime={entry.date}>{formatDate(entry.date)}</time>
          <h3 className="mt-2 text-lg font-extrabold">{entry.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{entry.excerpt}</p>
          <Link href={`/diaries#${entry.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary">
            اقرأ اليومية <ArrowLeft className="size-3.5" aria-hidden="true" />
          </Link>
        </article>
      ))}
    </div>
  );
}
