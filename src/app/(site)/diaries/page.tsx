import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { DiaryTimeline } from "@/components/blog/diary-timeline";
import { PageIntro } from "@/components/shared/page-intro";
import { contentRepository } from "@/lib/data";

export const metadata: Metadata = { title: "اليوميات" };

export default function DiariesPage() {
  return (
    <main>
      <PageIntro eyebrow="على مهل" title="اليوميات" description="تفاصيل وملاحظات زمنية بصيغة أبسط وأكثر قربًا من السجل الشخصي." />
      <Container className="py-10 sm:py-12">
        <div className="mx-auto max-w-3xl"><DiaryTimeline entries={contentRepository.getDiaries()} /></div>
      </Container>
    </main>
  );
}
