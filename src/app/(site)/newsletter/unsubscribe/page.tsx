import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { NewsletterTokenAction } from "@/components/blog/newsletter-token-action";
import { unsubscribeNewsletterAction } from "@/app/(site)/newsletter/actions";

export const metadata: Metadata = { title: "إلغاء الاشتراك", robots: { index: false, follow: false } };

export default async function UnsubscribeNewsletterPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main><Container className="py-20"><div className="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-border bg-card p-7 text-center"><h1 className="text-3xl font-black">إلغاء الاشتراك</h1><p className="mt-3 leading-8 text-muted-foreground">لن يتم إلغاء اشتراكك لمجرد فتح الرابط. اضغط الزر أدناه للتأكيد.</p><NewsletterTokenAction token={token} action={unsubscribeNewsletterAction} buttonLabel="إلغاء الاشتراك" /></div></Container></main>;
}
