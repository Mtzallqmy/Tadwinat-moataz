import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { categoriesRepository } from "@/lib/repositories/categories";
import { postsRepository } from "@/lib/repositories/posts";
import { announcementsRepository } from "@/lib/repositories/announcements";
import { settingsRepository } from "@/lib/repositories/settings";
import { buildBlogSchema,buildPersonSchema,buildWebsiteSchema,serializeJsonLd } from "@/lib/seo/structured-data";
import type { ReactNode } from "react";

export default async function SiteLayout({children}:{children:ReactNode}){
  const [categories,postPage,announcement,settings]=await Promise.all([categoriesRepository.listPublic(),postsRepository.listPublished({pageSize:20}),announcementsRepository.getActive(),settingsRepository.getPublic()]);
  const jsonLd=[buildWebsiteSchema(settings),buildPersonSchema(settings),buildBlogSchema(settings)];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(jsonLd)}}/><AnnouncementBar announcement={announcement}/><Header categories={categories} posts={postPage.posts}/>{children}<Footer/><MobileBottomNav/></>;
}
