import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";

export const metadata: Metadata = { title: "إخلاء المسؤولية" };

export default function DisclaimerPage() {
  return (
    <main>
      <PageIntro eyebrow="قانوني — مسودة" title="إخلاء المسؤولية" description="قالب أولي واضح يحتاج مراجعة وتخصيصًا قبل النشر النهائي." />
      <Container className="py-10 sm:py-12">
        <div className="article-prose rounded-[var(--radius-lg)] border border-border bg-card p-6 sm:p-8">
          <p><strong>Placeholder يحتاج تعديلًا قبل الإطلاق.</strong></p>
          <h2>المحتوى العام</h2><p>المحتوى المنشور لأغراض معرفية وتثقيفية عامة، وسيتم صياغة الشروط النهائية وفق طبيعة المنصة ومصادرها.</p>
          <h2>إخلاء المسؤولية الطبية</h2><p>أي محتوى طبي أو صيدلاني يُنشر مستقبلًا لا ينبغي أن يحل محل التقييم أو التشخيص أو العلاج من مختص صحي مؤهل. يجب مراجعة الصياغة القانونية النهائية قبل الإطلاق.</p>
          <h2>الروابط الخارجية</h2><p>ستُحدد سياسة التعامل مع الروابط والمصادر الخارجية عند اعتماد نظام النشر النهائي.</p>
        </div>
      </Container>
    </main>
  );
}
