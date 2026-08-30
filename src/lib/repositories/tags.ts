import { createClient } from "@/lib/supabase/server";
import { slugCandidate, slugify } from "@/lib/content/slug";
import type { Tag } from "@/types/content";

type Row = Record<string, unknown>;

function mapTag(row: Row): Tag & { count: number } {
  const counts = Array.isArray(row.post_tags) ? row.post_tags as Row[] : [];
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : null,
    count: typeof counts[0]?.count === "number" ? counts[0].count : 0,
  };
}

export const tagsRepository = {
  async list() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug, description, post_tags(count)")
      .order("name");
    if (error) throw new Error(`TAGS_QUERY_FAILED: ${error.message}`);
    return (data ?? []).map((row) => mapTag(row as Row));
  },

  async getBySlug(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug, description, post_tags(count)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`TAG_QUERY_FAILED: ${error.message}`);
    return data ? mapTag(data as Row) : null;
  },

  async ensureUniqueSlug(input: string, currentId?: string) {
    const supabase = await createClient();
    const base = slugify(input);
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const candidate = slugCandidate(base, attempt);
      let query = supabase.from("tags").select("id").eq("slug", candidate).limit(1);
      if (currentId) query = query.neq("id", currentId);
      const { data, error } = await query;
      if (error) throw new Error(`TAG_SLUG_CHECK_FAILED: ${error.message}`);
      if (!data?.length) return candidate;
    }
    throw new Error("TAG_SLUG_EXHAUSTED");
  },
};
