import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";

export const metadata: Metadata = { title: "سياسة الخصوصية" };

export default function PrivacyPage() {
  return (
    <main>
      <PageIntro eyebrow="قانوني — مسودة" title="سياسة الخصوصية" description="قالب أولي يحتاج مراجعة وتخصيصًا قانونيًا قبل إطلاق الموقع للإنتاج." />
      <Container className="py-10 sm:py-12">
        <div className="article-prose rounded-[var(--radius-lg)] border border-border bg-card p-6 sm:p-8">
          <p><strong>تنبيه:</strong> النص التالي Placeholder وليس سياسة قانونية نهائية.</p>
          <h2>البيانات التي قد تُجمع</h2><p>سيتم توضيح أنواع البيانات التي تجمعها المنصة بعد تحديد خدمات التحليلات والنشرة ونموذج التواصل.</p>
          <h2>ملفات الارتباط</h2><p>سيتم توضيح استخدام ملفات الارتباط وخيارات المستخدم بعد اعتماد الأدوات النهائية.</p>
          <h2>التواصل</h2><p>ستُضاف وسيلة اتصال مخصصة لطلبات الخصوصية بعد تجهيز البنية التشغيلية.</p>
        </div>
      </Container>
    </main>
  );
}
