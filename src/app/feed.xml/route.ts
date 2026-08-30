import { postsRepository } from "@/lib/repositories/posts";
import { settingsRepository } from "@/lib/repositories/settings";
import { buildRss } from "@/lib/feed/xml";
export const revalidate=300;
export async function GET(){const [page,settings]=await Promise.all([postsRepository.listPublished({pageSize:50}),settingsRepository.getPublic()]);return new Response(buildRss(page.posts,settings),{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"public, max-age=0, s-maxage=300, stale-while-revalidate=600"}});}
