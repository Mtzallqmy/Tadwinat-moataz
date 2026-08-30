export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-lg font-black text-primary shadow-[var(--shadow-soft)]">م</span>{!compact ? <span className="leading-tight"><span className="block text-base font-extrabold tracking-tight text-foreground">معتز العلقمي</span><span className="mt-0.5 block text-[11px] text-muted-foreground">معرفة · تدوين · قراءة</span></span> : null}</span>;
}
