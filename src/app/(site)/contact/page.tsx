import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";

export const metadata: Metadata = { title: "تواصل" };

const fields = [
  { id: "name", label: "الاسم", type: "text", placeholder: "اسمك" },
  { id: "email", label: "البريد", type: "email", placeholder: "name@example.com" },
  { id: "subject", label: "الموضوع", type: "text", placeholder: "موضوع الرسالة" },
];

export default function ContactPage() {
  return (
    <main>
      <PageIntro eyebrow="تواصل" title="أرسل رسالة" description="النموذج في هذه المرحلة واجهة فقط، ولن يدّعي إرسال الرسائل قبل ربطه بالخدمة الفعلية." />
      <Container className="py-10 sm:py-12">
        <form className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-border bg-card p-5 sm:p-7">
          <div className="grid gap-5">
            {fields.map((field) => (
              <label key={field.id} htmlFor={field.id} className="grid gap-2 text-sm font-bold">
                {field.label}
                <input id={field.id} type={field.type} placeholder={field.placeholder} className="h-12 rounded-xl border border-border bg-background px-4 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>
            ))}
            <label htmlFor="message" className="grid gap-2 text-sm font-bold">
              الرسالة
              <textarea id="message" rows={7} placeholder="اكتب رسالتك..." className="resize-y rounded-xl border border-border bg-background p-4 font-normal leading-7 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
          </div>
          <button type="button" disabled className="mt-6 h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-65">الإرسال غير مفعّل بعد</button>
          <p className="mt-2 text-xs text-muted-foreground">سيتم ربط الإرسال في مرحلة Backend لاحقة.</p>
        </form>
      </Container>
    </main>
  );
}
