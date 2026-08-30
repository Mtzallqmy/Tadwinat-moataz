import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function SectionHeading({ title, eyebrow, description, href, linkLabel = "عرض الكل" }: { title: string; eyebrow?: string; description?: string; href?: string; linkLabel?: string }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div className="max-w-2xl">{eyebrow ? <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p> : null}<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>{description ? <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p> : null}</div>{href ? <Link href={href} className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline sm:flex">{linkLabel}<ArrowLeft className="size-4" aria-hidden="true" /></Link> : null}</div>;
}
