import { CloudOff, FileQuestion, SearchX, TriangleAlert } from "lucide-react";

const variants = { empty: { Icon: FileQuestion, title: "لا يوجد محتوى بعد" }, search: { Icon: SearchX, title: "لا توجد نتائج" }, error: { Icon: TriangleAlert, title: "حدث خطأ غير متوقع" }, offline: { Icon: CloudOff, title: "يبدو أن الاتصال غير متاح" } };

export function StatePanel({ variant = "empty", description = "ستظهر العناصر هنا عندما تصبح متاحة." }: { variant?: keyof typeof variants; description?: string }) {
  const { Icon, title } = variants[variant];
  return <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-muted/40 px-6 py-12 text-center"><Icon className="mx-auto size-7 text-muted-foreground" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{description}</p></div>;
}

export function CardSkeleton() {
  return <div className="animate-pulse overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card"><div className="aspect-[16/10] bg-muted" /><div className="space-y-3 p-5"><div className="h-3 w-20 rounded bg-muted" /><div className="h-6 w-4/5 rounded bg-muted" /><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-2/3 rounded bg-muted" /></div></div>;
}
