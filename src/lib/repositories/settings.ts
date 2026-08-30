import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SiteSettings } from "@/types/content";

const fallback: SiteSettings = {
  siteName: "معتز العلقمي",
  siteDescription: "منصة شخصية للنشر والمعرفة والتدوين",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  authorName: "معتز العلقمي",
  authorBio: "",
  publisherName: "معتز العلقمي",
  timezone: "Asia/Aden",
  defaultIndexing: true,
  indexTagPages: false,
};

type Row = Record<string, unknown>;
function mediaUrl(supabase: ReturnType<typeof createPublicClient>, relation: unknown) {
  const row = Array.isArray(relation) ? relation[0] : relation;
  if (!row || typeof row !== "object") return null;
  const value = row as Row;
  if (typeof value.bucket !== "string" || typeof value.path !== "string") return null;
  return supabase.storage.from(value.bucket).getPublicUrl(value.path).data.publicUrl;
}
function map(row: Row, publicClient: ReturnType<typeof createPublicClient>): SiteSettings {
  return {
    siteName: typeof row.site_name === "string" ? row.site_name : fallback.siteName,
    siteDescription: typeof row.site_description === "string" ? row.site_description : fallback.siteDescription,
    siteUrl: typeof row.site_url === "string" && row.site_url ? row.site_url : fallback.siteUrl,
    authorName: typeof row.author_name === "string" ? row.author_name : fallback.authorName,
    authorBio: typeof row.author_bio === "string" ? row.author_bio : "",
    publisherName: typeof row.publisher_name === "string" ? row.publisher_name : fallback.publisherName,
    timezone: typeof row.timezone === "string" ? row.timezone : fallback.timezone,
    defaultIndexing: row.default_indexing !== false,
    indexTagPages: row.index_tag_pages === true,
    defaultOgImage: mediaUrl(publicClient, row.default_og_image),
    twitterHandle: typeof row.twitter_handle === "string" ? row.twitter_handle : null,
    telegramUrl: typeof row.telegram_url === "string" ? row.telegram_url : null,
    xUrl: typeof row.x_url === "string" ? row.x_url : null,
    instagramUrl: typeof row.instagram_url === "string" ? row.instagram_url : null,
    linkedinUrl: typeof row.linkedin_url === "string" ? row.linkedin_url : null,
    youtubeUrl: typeof row.youtube_url === "string" ? row.youtube_url : null,
  };
}

const SELECT = "site_name,site_description,site_url,author_name,author_bio,publisher_name,timezone,default_indexing,index_tag_pages,twitter_handle,telegram_url,x_url,instagram_url,linkedin_url,youtube_url,default_og_image:media!site_settings_default_og_image_id_fkey(bucket,path)";

export const settingsRepository = {
  async getPublic(): Promise<SiteSettings> {
    if (!isSupabaseConfigured()) return fallback;
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("site_settings").select(SELECT).eq("id", true).maybeSingle();
    if (error || !data) return fallback;
    return map(data as Row, supabase);
  },
  async getAdmin() {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
    if (error) throw new Error(`SITE_SETTINGS_QUERY_FAILED: ${error.message}`);
    return data as Row | null;
  },
};
