import type { Post, SiteSettings } from "@/types/content";
import { getAbsoluteUrl, getCanonicalPostUrl } from "@/lib/site/url";

export type JsonLd = Record<string, unknown>;
const ctx = "https://schema.org";
export function buildWebsiteSchema(settings: SiteSettings): JsonLd { return { "@context": ctx, "@type": "WebSite", "@id": `${settings.siteUrl}#website`, url: settings.siteUrl, name: settings.siteName, description: settings.siteDescription, inLanguage: "ar" }; }
export function buildPersonSchema(settings: SiteSettings): JsonLd {
  const sameAs = [settings.telegramUrl,settings.xUrl,settings.instagramUrl,settings.linkedinUrl,settings.youtubeUrl].filter(Boolean);
  return { "@context": ctx, "@type": "Person", "@id": `${getAbsoluteUrl("/about",settings.siteUrl)}#person`, name: settings.authorName, description: settings.authorBio || undefined, url: getAbsoluteUrl("/about",settings.siteUrl), sameAs: sameAs.length ? sameAs : undefined };
}
export function buildBlogSchema(settings: SiteSettings): JsonLd { return { "@context": ctx, "@type": "Blog", "@id": `${settings.siteUrl}#blog`, url: settings.siteUrl, name: settings.siteName, description: settings.siteDescription, author: { "@id": `${getAbsoluteUrl("/about",settings.siteUrl)}#person` }, inLanguage: "ar" }; }
export function buildBreadcrumbSchema(items: { name: string; path: string }[], settings: SiteSettings): JsonLd { return { "@context": ctx, "@type": "BreadcrumbList", itemListElement: items.map((item,index)=>({ "@type":"ListItem", position:index+1, name:item.name, item:getAbsoluteUrl(item.path,settings.siteUrl) })) }; }
export function buildWebPageSchema(post: Post, settings: SiteSettings): JsonLd { const url=getCanonicalPostUrl(post.slug,post.canonicalUrl,settings.siteUrl); return { "@context":ctx,"@type":"WebPage","@id":`${url}#webpage`,url,name:post.title,description:post.seoDescription||post.excerpt,datePublished:post.publishedAt,dateModified:post.updatedAt||post.publishedAt,inLanguage:"ar" }; }
export function buildArticleSchema(post: Post, settings: SiteSettings): JsonLd {
  const url=getCanonicalPostUrl(post.slug,post.canonicalUrl,settings.siteUrl);
  return { "@context":ctx,"@type":post.contentType==="article"?"BlogPosting":"Article","@id":`${url}#article`,headline:post.title,description:post.seoDescription||post.excerpt,image:post.ogImage||post.cover,datePublished:post.publishedAt,dateModified:post.updatedAt||post.publishedAt,author:{"@type":"Person",name:post.author?.name||settings.authorName,url:getAbsoluteUrl("/about",settings.siteUrl)},publisher:{"@type":"Organization",name:settings.publisherName},mainEntityOfPage:{"@id":`${url}#webpage`},url,inLanguage:"ar" };
}
export function buildFaqSchema(post: Post): JsonLd | null { if (!post.faqs?.length) return null; return { "@context":ctx,"@type":"FAQPage",mainEntity:post.faqs.map((faq)=>({"@type":"Question",name:faq.question,acceptedAnswer:{"@type":"Answer",text:faq.answer}})) }; }
export function serializeJsonLd(value: JsonLd | JsonLd[]) { return JSON.stringify(value).replace(/</g,"\\u003c"); }
