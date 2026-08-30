import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hash } from "lucide-react";
import { Container } from "@/components/shared/container";
import { ArticleCard } from "@/components/blog/article-card";
import { contentRepository } from "@/lib/data";

export function generateStaticParams() {
  const tags = new Set(contentRepository.getPosts().flatMap((post) => post.tags));
  return [...tags].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `وسم: ${slug}` };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = contentRepository.getPosts().filter((post) => post.tags.includes(slug));
  if (!posts.length) notFound();

  return (
    <main>
      <div className="border-b border-border bg-muted/20 py-10 sm:py-14">
        <Container>
          <Hash className="size-7 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-3xl font-black">وسم: {slug}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{posts.length} مواد مرتبطة بهذا الوسم.</p>
        </Container>
      </div>
      <Container className="py-10 sm:py-12">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{posts.map((post) => <ArticleCard key={post.slug} post={post} />)}</div>
      </Container>
    </main>
  );
}
