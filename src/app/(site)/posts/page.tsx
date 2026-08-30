import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { PageIntro } from "@/components/shared/page-intro";
import { PostsExplorer } from "@/components/blog/posts-explorer";
import { contentRepository } from "@/lib/data";

export const metadata: Metadata = { title: "المقالات", description: "جميع المقالات والتدوينات المنشورة في معتز العلقمي." };

export default function PostsPage() {
  return (
    <main>
      <PageIntro eyebrow="الأرشيف المفتوح" title="جميع المقالات" description="ابحث وصفِّ ورتّب المحتوى المنشور حسب القسم أو النوع." />
      <Container className="py-10 sm:py-12">
        <PostsExplorer posts={contentRepository.getPosts()} categories={contentRepository.getCategories()} />
      </Container>
    </main>
  );
}
