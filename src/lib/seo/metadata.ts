import type { Metadata } from "next";
import type { Post, SiteSettings } from "@/types/content";
import { getCanonicalPostUrl, getAbsoluteUrl, normalizeSiteUrl } from "@/lib/site/url";

export function buildPostMetadata(post: Post, settings: SiteSettings): Metadata {
  const title = post.seoTitle?.trim() || post.title;
  const description = post.seoDescription?.trim() || post.excerpt;
  const canonical = getCanonicalPostUrl(post.slug, post.canonicalUrl, settings.siteUrl);
  const socialImage = post.ogImage || post.cover || settings.defaultOgImage || getAbsoluteUrl(`/posts/${post.slug}/opengraph-image`, settings.siteUrl);
  const twitterImage = post.twitterImage || socialImage;
  return {
    metadataBase: new URL(normalizeSiteUrl(settings.siteUrl)),
    title,
    description,
    alternates: { canonical, types: { "application/rss+xml": getAbsoluteUrl("/feed.xml", settings.siteUrl), "application/atom+xml": getAbsoluteUrl("/atom.xml", settings.siteUrl), "application/feed+json": getAbsoluteUrl("/feed.json", settings.siteUrl) } },
    robots: { index: post.robotsIndex ?? settings.defaultIndexing, follow: post.robotsFollow ?? true, googleBot: { index: post.robotsIndex ?? settings.defaultIndexing, follow: post.robotsFollow ?? true } },
    openGraph: { type: "article", locale: "ar", siteName: settings.siteName, title: post.ogTitle?.trim() || title, description: post.ogDescription?.trim() || description, url: canonical, images: [{ url: socialImage }], publishedTime: post.publishedAt, modifiedTime: post.updatedAt, authors: [settings.authorName] },
    twitter: { card: "summary_large_image", title: post.twitterTitle?.trim() || post.ogTitle?.trim() || title, description: post.twitterDescription?.trim() || post.ogDescription?.trim() || description, images: [twitterImage], creator: settings.twitterHandle || undefined },
  };
}

export function buildArchiveMetadata(title: string, description: string, canonicalPath: string, settings: SiteSettings, index = true): Metadata {
  const canonical = getAbsoluteUrl(canonicalPath, settings.siteUrl);
  return { title, description, alternates: { canonical }, robots: { index, follow: true }, openGraph: { type: "website", title, description, url: canonical, siteName: settings.siteName, locale: "ar" } };
}
