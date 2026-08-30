import type { MetadataRoute } from "next";
import { settingsRepository } from "@/lib/repositories/settings";
import { getAbsoluteUrl } from "@/lib/site/url";

export default async function robots():Promise<MetadataRoute.Robots>{
  const settings=await settingsRepository.getPublic();
  return {rules:[{userAgent:"*",allow:"/",disallow:["/admin","/admin/","/auth/","/api/private/","/api/preview/","/preview/"]}],sitemap:getAbsoluteUrl("/sitemap.xml",settings.siteUrl),host:settings.siteUrl};
}
