import { createClient } from "@/lib/supabase/server";
import { slugCandidate, slugify } from "@/lib/content/slug";
import type { Category } from "@/types/content";

type Row = Record<string, unknown>;

function mapCategory(row: Row): Category {
  const counts = Array.isArray(row.post_categories) ? row.post_categories as Row[] : [];
  const count = typeof counts[0]?.count === "number" ? counts[0].count : 0;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : "",
    icon: typeof row.icon === "string" ? row.icon : "folder",
    count,
    color: typeof row.color === "string" ? row.color : null,
    parentId: typeof row.parent_id === "string" ? row.parent_id : null,
    isActive: row.is_active !== false,
  };
}

export const categoriesRepository = {
  async listPublic() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, icon, color, parent_id, sort_order, is_active, post_categories(count)")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");
    if (error) throw new Error(`PUBLIC_CATEGORIES_QUERY_FAILED: ${error.message}`);
    return (data ?? []).map((row) => mapCategory(row as Row));
  },

  async listAdmin() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, icon, color, parent_id, sort_order, is_active, post_categories(count)")
      .order("sort_order")
      .order("name");
    if (error) throw new Error(`ADMIN_CATEGORIES_QUERY_FAILED: ${error.message}`);
    return (data ?? []).map((row) => mapCategory(row as Row));
  },

  async getPublicBySlug(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, icon, color, parent_id, sort_order, is_active, post_categories(count)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(`PUBLIC_CATEGORY_QUERY_FAILED: ${error.message}`);
    return data ? mapCategory(data as Row) : null;
  },

  async ensureUniqueSlug(input: string, currentId?: string) {
    const supabase = await createClient();
    const base = slugify(input);
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const candidate = slugCandidate(base, attempt);
      let query = supabase.from("categories").select("id").eq("slug", candidate).limit(1);
      if (currentId) query = query.neq("id", currentId);
      const { data, error } = await query;
      if (error) throw new Error(`CATEGORY_SLUG_CHECK_FAILED: ${error.message}`);
      if (!data?.length) return candidate;
    }
    throw new Error("CATEGORY_SLUG_EXHAUSTED");
  },
};
