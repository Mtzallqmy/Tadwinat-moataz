import type { MetadataRoute } from "next";
import { postsRepository } from "@/lib/repositories/posts";
import { settingsRepository } from "@/lib/repositories/settings";
import { categoriesRepository } from "@/lib/repositories/categories";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAbsoluteUrl } from "@/lib/site/url";

export const revalidate=300;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const [settings,posts,categories]=await Promise.all([settingsRepository.getPublic(),postsRepository.listSitemapEntries(),categoriesRepository.listPublic()]);
  const urls:MetadataRoute.Sitemap=[
    {url:getAbsoluteUrl("/",settings.siteUrl),changeFrequency:"weekly",priority:1},
    {url:getAbsoluteUrl("/posts",settings.siteUrl),changeFrequency:"daily",priority:0.9},
    {url:getAbsoluteUrl("/about",settings.siteUrl),changeFrequency:"monthly",priority:0.6},
    {url:getAbsoluteUrl("/archive",settings.siteUrl),changeFrequency:"daily",priority:0.6},
    ...posts.map((post)=>({url:getAbsoluteUrl(`/posts/${post.slug}`,settings.siteUrl),lastModified:post.updatedAt,changeFrequency:"weekly" as const,priority:0.8})),
    ...categories.map((category)=>({url:getAbsoluteUrl(`/category/${category.slug}`,settings.siteUrl),changeFrequency:"weekly" as const,priority:0.6})),
  ];
  if(settings.indexTagPages&&isSupabaseConfigured()){
    const supabase=createPublicClient(); const {data}=await supabase.from("tags").select("slug").order("slug");
    urls.push(...(data??[]).map((tag)=>({url:getAbsoluteUrl(`/tag/${tag.slug}`,settings.siteUrl),changeFrequency:"weekly" as const,priority:0.4})));
  }
  return urls;
}
