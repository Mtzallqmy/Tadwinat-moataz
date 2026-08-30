import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "غير متصل", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return <main><Container className="grid min-h-[70vh] place-items-center py-16"><section className="max-w-xl rounded-[var(--radius-lg)] border border-border bg-card p-8 text-center"><p className="text-sm font-black text-primary">وضع عدم الاتصال</p><h1 className="mt-3 text-3xl font-black">أنت غير متصل بالإنترنت</h1><p className="mt-4 text-muted-foreground">يمكنك إعادة المحاولة عند استعادة الاتصال. المقالات العامة التي فتحتها سابقًا قد تبقى متاحة من الذاكرة المؤقتة.</p><Link className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" href="/">العودة للرئيسية</Link></section></Container></main>;
}
