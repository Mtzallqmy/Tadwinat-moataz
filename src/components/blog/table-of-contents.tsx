import Link from "next/link";

const items = [
  { id: "why-slow", label: "لماذا نحتاج إلى البطء؟" },
  { id: "attention", label: "الانتباه مورد محدود" },
  { id: "practice", label: "ممارسات بسيطة" },
  { id: "closing", label: "خلاصة" },
];

function TocLinks() {
  return (
    <nav aria-label="فهرس المقال" className="grid gap-2 text-sm">
      {items.map((item) => <Link key={item.id} href={`#${item.id}`} className="rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">{item.label}</Link>)}
    </nav>
  );
}

export function TableOfContents() {
  return (
    <>
      <aside className="sticky top-24 hidden self-start rounded-2xl border border-border bg-card p-4 lg:block">
        <p className="mb-3 text-xs font-black text-foreground">في هذا المقال</p>
        <TocLinks />
      </aside>
      <details className="rounded-2xl border border-border bg-card p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-bold">في هذا المقال</summary>
        <div className="mt-3 border-t border-border pt-3"><TocLinks /></div>
      </details>
    </>
  );
}
