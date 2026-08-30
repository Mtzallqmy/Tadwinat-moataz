import { postsRepository } from "@/lib/repositories/posts";
import { settingsRepository } from "@/lib/repositories/settings";
import { buildRss } from "@/lib/feed/xml";
export const revalidate=300;
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){const {slug}=await params;const [page,settings]=await Promise.all([postsRepository.listPublished({pageSize:50,categorySlug:slug}),settingsRepository.getPublic()]);return new Response(buildRss(page.posts,{...settings,siteName:`${settings.siteName} — ${slug}`}),{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"public, max-age=0, s-maxage=300, stale-while-revalidate=600"}});}
