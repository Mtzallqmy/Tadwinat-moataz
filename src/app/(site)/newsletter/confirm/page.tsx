import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { NewsletterTokenAction } from "@/components/blog/newsletter-token-action";
import { confirmNewsletterAction } from "@/app/(site)/newsletter/actions";

export const metadata: Metadata = { title: "تأكيد الاشتراك", robots: { index: false, follow: false } };

export default async function ConfirmNewsletterPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main><Container className="py-20"><div className="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-border bg-card p-7 text-center"><h1 className="text-3xl font-black">تأكيد الاشتراك</h1><p className="mt-3 leading-8 text-muted-foreground">اضغط الزر لإتمام الاشتراك. لا يتم التأكيد بمجرد فتح الرابط لحمايتك من فاحصات الروابط التلقائية.</p><NewsletterTokenAction token={token} action={confirmNewsletterAction} buttonLabel="تأكيد الاشتراك" /></div></Container></main>;
}
