import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { CuratedLinks } from "@/components/blog/curated-links";
import { PageIntro } from "@/components/shared/page-intro";
import { contentRepository } from "@/lib/data";

export const metadata: Metadata = { title: "الروابط المختارة" };

export default function LinksPage() {
  return (
    <main>
      <PageIntro eyebrow="اختيارات" title="روابط تستحق القراءة" description="روابط Demo مع ملاحظات قصيرة؛ سيتم استبدالها بالمصادر الفعلية لاحقًا." />
      <Container className="py-10 sm:py-12"><CuratedLinks links={contentRepository.getLinks()} /></Container>
    </main>
  );
}
