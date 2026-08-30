import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, Quote, Sparkles } from "lucide-react";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ArticleCard } from "@/components/blog/article-card";
import { CategoryCard } from "@/components/blog/category-card";
import { CompactPostList } from "@/components/blog/compact-post-list";
import { ContentTypes } from "@/components/blog/content-types";
import { CuratedLinks } from "@/components/blog/curated-links";
import { DiaryTimeline } from "@/components/blog/diary-timeline";
import { FeaturedPost } from "@/components/blog/featured-post";
import { Newsletter } from "@/components/blog/newsletter";
import { PopularList } from "@/components/blog/popular-list";
import { contentRepository } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default function HomePage() {
  const featured = contentRepository.getFeaturedPost();
  const latest = contentRepository.getLatestPosts(6);
  const categories = contentRepository.getCategories();
  const medicalPharmacy = [...contentRepository.getPostsByCategory("medical"), ...contentRepository.getPostsByCategory("pharmacy")].slice(0, 3);
  const cultureLanguage = [...contentRepository.getPostsByCategory("culture"), ...contentRepository.getPostsByCategory("language")].slice(0, 3);
  const thoughtReligion = [...contentRepository.getPostsByCategory("thought"), ...contentRepository.getPostsByCategory("religion")].filter((post) => !post.featured).slice(0, 3);
  const notes = contentRepository.getNotes();

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_35%)]" />
        <Container className="relative grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:py-20">
          <AnimatedReveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="size-4" aria-hidden="true" /> منصة شخصية للنشر والمعرفة والتدوين
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.45] tracking-[-0.035em] sm:text-5xl lg:text-[3.45rem]">
              أفكار تُلهم، <span className="text-primary">ومعرفة تُنير</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-9 text-muted-foreground sm:text-lg">مساحة شخصية أشارك فيها أفكاري وقراءاتي وتجربتي في الطب والصيدلة والثقافة واللغة والدين والفكر والحياة.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/posts" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90">
                استكشف المقالات <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
              <Link href="#categories" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-bold hover:border-primary/30 hover:bg-accent">
                تصفح الأقسام <BookOpen className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </AnimatedReveal>
          <AnimatedReveal className="lg:pr-5">
            <div className="relative mx-auto max-w-[560px]">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/[0.045]" />
              <Image src="/demo/hero-editorial.svg" width={900} height={680} sizes="(max-width: 1024px) 100vw, 48vw" alt="تكوين تحريري تجريدي يرمز للقراءة والكتابة" className="w-full rounded-[1.75rem] border border-border bg-card shadow-[var(--shadow-card)]" priority />
            </div>
          </AnimatedReveal>
        </Container>
      </section>

      <section className="py-[var(--space-section)]">
        <Container>
          <SectionHeading eyebrow="اختيار المحرر" title="مقال مميز" />
          <FeaturedPost post={featured} />
        </Container>
      </section>

      <section className="border-y border-border bg-muted/20 py-[var(--space-section)]">
        <Container>
          <SectionHeading title="أحدث المقالات" description="مساحة متجددة للمقالات والقراءات الطويلة." href="/posts" />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {latest.map((post) => <ArticleCard key={post.slug} post={post} />)}
          </div>
        </Container>
      </section>

      <section className="py-[var(--space-section)]">
        <Container>
          <SectionHeading title="طرق مختلفة للكتابة" description="ليس كل ما يستحق النشر يحتاج إلى قالب المقال الطويل." />
          <ContentTypes />
        </Container>
      </section>

      <section id="categories" className="border-y border-border bg-muted/20 py-[var(--space-section)]">
        <Container>
          <SectionHeading title="تصفح الأقسام" description="مسارات موضوعية واضحة للوصول إلى ما يهمك." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => <CategoryCard key={category.slug} category={category} />)}
          </div>
        </Container>
      </section>

      <section className="py-[var(--space-section)]">
        <Container className="grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <SectionHeading title="ملاحظات سريعة" description="أفكار قصيرة لا تحتاج إلى مقال كامل." href="/notes" />
            <div className="grid gap-3">
              {notes.map((note) => (
                <blockquote key={note.id} className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
                  <Quote className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold leading-8">{note.text}</p>
                  <time dateTime={note.date} className="mt-3 block text-xs text-muted-foreground">{formatDate(note.date)}</time>
                </blockquote>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading title="الأكثر قراءة" />
            <PopularList posts={contentRepository.getPopularPosts()} />
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-muted/20 py-[var(--space-section)]">
        <Container>
          <SectionHeading eyebrow="قراءة عملية" title="طب وصيدلة" description="محتوى تجريبي محايد يركز على الثقافة الصحية وفهم المصطلحات." href="/category/pharmacy" />
          <CompactPostList posts={medicalPharmacy} />
        </Container>
      </section>

      <section className="py-[var(--space-section)]">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading title="ثقافة ولغة" />
            <CompactPostList posts={cultureLanguage} />
          </div>
          <div>
            <SectionHeading title="دين وفكر" />
            <CompactPostList posts={thoughtReligion} />
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-muted/20 py-[var(--space-section)]">
        <Container className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <SectionHeading title="اليوميات" description="تفاصيل صغيرة من الأيام، بصيغة أقرب إلى سجل زمني." href="/diaries" />
            <DiaryTimeline entries={contentRepository.getDiaries()} />
          </div>
          <div>
            <SectionHeading title="روابط تستحق القراءة" description="اختيارات من الويب مع ملاحظات شخصية قصيرة." href="/links" />
            <CuratedLinks links={contentRepository.getLinks()} />
          </div>
        </Container>
      </section>

      <section className="py-[var(--space-section)]">
        <Container><Newsletter /></Container>
      </section>
    </main>
  );
}
