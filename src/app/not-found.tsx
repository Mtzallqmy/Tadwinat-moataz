import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Container } from "@/components/shared/container";

export default function NotFound() {
  return (
    <main className="grid min-h-[75vh] place-items-center py-16">
      <Container className="text-center">
        <Compass className="mx-auto size-10 text-primary" aria-hidden="true" />
        <p className="mt-5 text-sm font-bold text-primary">404</p>
        <h1 className="mt-2 text-4xl font-black">هذه الصفحة غير موجودة</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">قد يكون الرابط قديمًا أو أن الصفحة لم تُنشأ بعد. يمكنك العودة إلى الصفحة الرئيسية ومتابعة التصفح.</p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">
          <ArrowRight className="size-4" aria-hidden="true" /> العودة للرئيسية
        </Link>
      </Container>
    </main>
  );
}
