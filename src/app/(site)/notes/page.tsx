import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";
import { contentRepository } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "التدوينات" };

export default function NotesPage() {
  const notes = contentRepository.getNotes();
  return (
    <main>
      <PageIntro eyebrow="خفيف وسريع" title="التدوينات" description="أفكار قصيرة وملاحظات لا تحتاج إلى بنية المقال الطويل." />
      <Container className="py-10 sm:py-12">
        <div className="mx-auto grid max-w-3xl gap-4">
          {notes.map((note) => (
            <article key={note.id} className="rounded-[var(--radius-lg)] border border-border bg-card p-5 sm:p-6">
              <NotebookPen className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-4 text-base font-semibold leading-9">{note.text}</p>
              <time className="mt-4 block text-xs text-muted-foreground" dateTime={note.date}>{formatDate(note.date)}</time>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
