import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";
import { SearchWorkspace } from "@/components/blog/search-workspace";
import { contentRepository } from "@/lib/data";

export const metadata: Metadata = { title: "البحث" };

export default function SearchPage() {
  return (
    <main>
      <PageIntro eyebrow="بحث" title="ابحث في معتز العلقمي" description="ابحث في المقالات والتدوينات واليوميات والروابط من واجهة واحدة." />
      <Container className="py-10 sm:py-12"><SearchWorkspace posts={contentRepository.getPosts()} /></Container>
    </main>
  );
}
