import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { contentRepository } from "@/lib/data";
import type { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const categories = contentRepository.getCategories();
  const posts = contentRepository.getPosts();
  const announcement = contentRepository.getAnnouncements()[0];

  return (
    <>
      <AnnouncementBar announcement={announcement} />
      <Header categories={categories} posts={posts} />
      {children}
      <Footer />
      <MobileBottomNav />
    </>
  );
}
