import Link from "next/link";
import { BookOpenText, FileText, Link2, NotebookPen, ScrollText } from "lucide-react";
import { contentTypes } from "@/lib/constants";

const icons = {
  article: BookOpenText,
  note: NotebookPen,
  diary: ScrollText,
  story: FileText,
  link: Link2,
};

const hrefs = {
  article: "/posts",
  note: "/notes",
  diary: "/diaries",
  story: "/posts?type=story",
  link: "/links",
};

export function ContentTypes() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {contentTypes.map((type) => {
        const Icon = icons[type.value];
        return (
          <Link key={type.value} href={hrefs[type.value]} className="rounded-[var(--radius-lg)] border border-border bg-card p-5 transition hover:border-primary/30 hover:bg-accent/60">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <h3 className="mt-4 font-extrabold">{type.name}</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{type.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
