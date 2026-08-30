import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Container } from "@/components/shared/container";
import { ArticleCard } from "@/components/blog/article-card";
import { contentRepository } from "@/lib/data";
import { formatNumber } from "@/lib/format";

export function generateStaticParams() {
  return contentRepository.getCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = contentRepository.getCategory(slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = contentRepository.getCategory(slug);
  if (!category) return notFound();

  const posts = contentRepository.getPostsByCategory(slug);

  return (
    <main>
      <div className="border-b border-border bg-muted/20 py-10 sm:py-14">
        <Container>
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><CategoryIcon name={category.icon} className="size-6" /></span>
          <p className="mt-5 text-sm font-bold text-primary">قسم</p>
          <h1 className="mt-1 text-4xl font-black">{category.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">{category.description}</p>
          <p className="mt-4 text-xs font-semibold text-muted-foreground">{formatNumber(category.count)} مادة في بيانات العرض</p>
        </Container>
      </div>
      <Container className="py-10 sm:py-12">
        {posts.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{posts.map((post) => <ArticleCard key={post.slug} post={post} />)}</div> : <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">لا توجد مواد منشورة في هذا القسم ضمن بيانات Demo الحالية.</p>}
      </Container>
    </main>
  );
}
