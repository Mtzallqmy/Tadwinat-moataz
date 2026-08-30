import { settingsRepository } from "@/lib/repositories/settings";
import { postsRepository } from "@/lib/repositories/posts";
import { getAbsoluteUrl } from "@/lib/site/url";
export const revalidate=3600;
export async function GET(){const [settings,page]=await Promise.all([settingsRepository.getPublic(),postsRepository.listPublished({pageSize:20})]);const lines=[`# ${settings.siteName}`,settings.siteDescription,"",`Author: ${settings.authorName}`,`Canonical site: ${settings.siteUrl}`,`RSS: ${getAbsoluteUrl("/feed.xml",settings.siteUrl)}`,"","## Recent public content",...page.posts.map((post)=>`- ${post.title}: ${getAbsoluteUrl(`/posts/${post.slug}`,settings.siteUrl)}`)];return new Response(lines.join("\n"),{headers:{"Content-Type":"text/plain; charset=utf-8"}});}
