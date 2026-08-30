import type { Metadata } from "next";
import { BookOpenText, Mail, PenLine } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "من أنا" };

export default function AboutPage() {
  return (
    <main>
      <PageIntro eyebrow="عن الموقع" title="معتز العلقمي" description="هذه الصفحة مهيأة لتقديم نبذة شخصية دون افتراض معلومات لم تُقدّم بعد." />
      <Container className="grid gap-8 py-10 sm:py-12 lg:grid-cols-[280px_1fr]">
        <aside className="self-start rounded-[var(--radius-lg)] border border-border bg-card p-6 text-center">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-primary/10 text-4xl font-black text-primary" role="img" aria-label="صورة شخصية مؤقتة">م</div>
          <h2 className="mt-4 text-xl font-black">معتز العلقمي</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">منصة شخصية للنشر والمعرفة والتدوين.</p>
        </aside>
        <div className="space-y-5">
          <AboutBlock Icon={PenLine} title="نبذة">
            <p>سيُضاف هنا تعريف شخصي موجز بعد تزويد المنصة بالمعلومات التي يرغب صاحب الموقع في نشرها.</p>
          </AboutBlock>
          <AboutBlock Icon={BookOpenText} title="لماذا أكتب؟">
            <p>هذه المساحة مخصصة لشرح الدافع من الكتابة والنشر، ويمكن تخصيصها لاحقًا بصوت صاحب الموقع وتجربته الفعلية.</p>
          </AboutBlock>
          <AboutBlock Icon={BookOpenText} title="الموضوعات التي أهتم بها">
            <p>الطب، الصيدلة، الثقافة، اللغة، الدين، الفكر، التقنية، والتجارب الشخصية — بوصفها أقسامًا تحريرية للمنصة.</p>
          </AboutBlock>
          <AboutBlock Icon={Mail} title="كيف أتواصل معي">
            <p>استخدم صفحة التواصل لإرسال رسالة بعد ربط النموذج بخدمة الإرسال في مرحلة لاحقة.</p>
          </AboutBlock>
        </div>
      </Container>
    </main>
  );
}

function AboutBlock({ Icon, title, children }: { Icon: typeof PenLine; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
      <div className="flex items-center gap-3"><Icon className="size-5 text-primary" /><h2 className="text-lg font-black">{title}</h2></div>
      <div className="mt-3 text-sm leading-8 text-muted-foreground">{children}</div>
    </section>
  );
}
