import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";

export const metadata: Metadata = { title: "إخلاء المسؤولية" };

export default function DisclaimerPage() {
  return <main><PageIntro eyebrow="قانوني" title="إخلاء المسؤولية" description="حدود استخدام المحتوى المنشور، خصوصًا المحتوى الطبي والروابط الخارجية."/><Container className="py-10 sm:py-12"><div className="article-prose rounded-[var(--radius-lg)] border border-border bg-card p-6 sm:p-8"><h2>المحتوى العام</h2><p>المحتوى المنشور لأغراض معرفية وتثقيفية وشخصية عامة. قد يتغير أو يُحدّث دون إشعار، ولا يُضمن خلو كل مادة من الخطأ رغم الحرص على الدقة.</p><h2>المحتوى الطبي والصيدلاني</h2><p>أي مادة طبية أو صيدلانية هي للتثقيف العام ولا تمثل تشخيصًا أو وصفة أو خطة علاج ولا تحل محل الطبيب أو الصيدلي أو المختص الصحي المؤهل. لا تؤخر طلب الرعاية الطبية بسبب محتوى منشور هنا.</p><h2>الروابط والمصادر الخارجية</h2><p>قد تتضمن المواد روابط أو مراجع خارجية لتوفير سياق إضافي. وجود الرابط لا يعني ضمان محتواه أو استمراره أو تبني جميع الآراء الواردة فيه.</p><h2>الاستخدام والمسؤولية</h2><p>يبقى قرار الاعتماد على المعلومات أو تطبيقها مسؤولية القارئ، مع مراعاة حالته وظروفه والأنظمة المحلية والاستعانة بمختص عند الحاجة.</p></div></Container></main>;
}
