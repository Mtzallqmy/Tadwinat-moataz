import { ExternalLink, Globe2 } from "lucide-react";
import type { LinkPost } from "@/types/content";

export function CuratedLinks({ links }: { links: LinkPost[] }) {
  return (
    <div className="divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-card">
      {links.map((link) => (
        <article key={link.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Globe2 className="size-4" aria-hidden="true" /> {link.domain}</div>
            <h3 className="mt-2 font-extrabold">{link.title}</h3>
            <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{link.note}</p>
          </div>
          <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-bold hover:border-primary/30 hover:bg-accent">
            فتح الرابط <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}
