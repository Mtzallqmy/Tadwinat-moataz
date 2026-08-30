import { Container } from "@/components/shared/container";

export function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return <div className="border-b border-border bg-muted/20 py-10 sm:py-14"><Container>{eyebrow ? <p className="text-sm font-bold text-primary">{eyebrow}</p> : null}<h1 className="mt-2 max-w-3xl text-3xl font-black leading-[1.45] tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">{description}</p></Container></div>;
}
