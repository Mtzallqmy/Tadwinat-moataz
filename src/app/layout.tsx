import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { settingsRepository } from "@/lib/repositories/settings";
import { getAbsoluteUrl, normalizeSiteUrl } from "@/lib/site/url";
import type { ReactNode } from "react";

const arabicFont=Noto_Sans_Arabic({subsets:["arabic"],variable:"--font-arabic",display:"swap"});

export async function generateMetadata(): Promise<Metadata> {
  const settings=await settingsRepository.getPublic();
  const metadataBase=new URL(normalizeSiteUrl(settings.siteUrl));
  return {
    metadataBase,
    title:{default:`${settings.siteName} | أفكار ومعرفة وتدوين`,template:`%s | ${settings.siteName}`},
    description:settings.siteDescription,
    authors:[{name:settings.authorName,url:getAbsoluteUrl("/about",settings.siteUrl)}], creator:settings.authorName, publisher:settings.publisherName,
    alternates:{types:{"application/rss+xml":getAbsoluteUrl("/feed.xml",settings.siteUrl),"application/atom+xml":getAbsoluteUrl("/atom.xml",settings.siteUrl),"application/feed+json":getAbsoluteUrl("/feed.json",settings.siteUrl)}},
    openGraph:{type:"website",locale:"ar",siteName:settings.siteName,title:`${settings.siteName} | أفكار ومعرفة وتدوين`,description:settings.siteDescription,images:settings.defaultOgImage?[{url:settings.defaultOgImage}]:undefined},
    twitter:{card:"summary_large_image",title:`${settings.siteName} | أفكار ومعرفة وتدوين`,description:settings.siteDescription,images:settings.defaultOgImage?[settings.defaultOgImage]:undefined,creator:settings.twitterHandle||undefined},
  };
}

export default function RootLayout({children}:Readonly<{children:ReactNode}>){return <html lang="ar" dir="rtl" suppressHydrationWarning><body className={`${arabicFont.variable} antialiased`}><ThemeProvider>{children}</ThemeProvider></body></html>;}
