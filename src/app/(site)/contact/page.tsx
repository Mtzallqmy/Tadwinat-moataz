import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";
import { ContactForm } from "@/components/blog/contact-form";

export const metadata: Metadata = { title: "تواصل" };

export default function ContactPage() {
  return (
    <main>
      <PageIntro eyebrow="تواصل" title="أرسل رسالة" description="رسالتك تصل إلى صندوق الوارد الإداري، مع حماية من الإساءة وحد أدنى من البيانات المطلوبة." />
      <Container className="py-10 sm:py-12"><ContactForm /></Container>
    </main>
  );
}
