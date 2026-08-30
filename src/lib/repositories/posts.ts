import type { JSONContent } from "@tiptap/core";
import { createClient } from "@/lib/supabase/server";
import { slugCandidate, slugify } from "@/lib/content/slug";
import { renderContentJson, contentJsonToText } from "@/lib/content/render";
import type { Post } from "@/types/content";

const POST_SELECT = `
  id, author_id, type, status, title, slug, excerpt, content_json, content_html, content_text,
  external_url, featured, published_at, scheduled_at, created_at, updated_at, deleted_at,
  cover:media!posts_cover_image_id_fkey(id, bucket, path, alt_text),
  author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role),
  post_categories(is_primary, category:categories(id, slug, name, description, icon, color, parent_id, is_active)),
  post_tags(tag:tags(id, slug, name, description))
`;

type Row = Record<string, unknown>;

type ListFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  status?: string;
  categoryId?: string;
  authorId?: string;
};

function estimateReadingMinutes(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function firstObject(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null;
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function mapPostRow(row: Row, publicUrl: (bucket: string, path: string) => string): Post {
  const cover = firstObject(row.cover);
  const author = firstObject(row.author);
  const categoryLinks = Array.isArray(row.post_categories) ? row.post_categories as Row[] : [];
  const categoryRows = categoryLinks
    .map((link) => ({ link, category: firstObject(link.category) }))
    .filter((entry): entry is { link: Row; category: Row } => Boolean(entry.category));
  const primary = categoryRows.find(({ link }) => link.is_primary === true)?.category ?? categoryRows[0]?.category;
  const tagLinks = Array.isArray(row.post_tags) ? row.post_tags as Row[] : [];
  const tags = tagLinks.map((link) => firstObject(link.tag)?.slug).filter((slug): slug is string => typeof slug === "string");
  const contentText = typeof row.content_text === "string" ? row.content_text : "";

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: typeof row.excerpt === "string" ? row.excerpt : "",
    category: typeof primary?.slug === "string" ? primary.slug : "misc",
    categories: categoryRows.map(({ category }) => String(category.slug)),
    contentType: row.type as Post["contentType"],
    status: row.status as Post["status"],
    publishedAt: typeof row.published_at === "string" ? row.published_at : String(row.created_at),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    readingMinutes: estimateReadingMinutes(contentText),
    views: 0,
    cover: cover && typeof cover.bucket === "string" && typeof cover.path === "string"
      ? publicUrl(cover.bucket, cover.path)
      : "/demo/cover-personal.svg",
    coverAlt: cover && typeof cover.alt_text === "string" ? cover.alt_text : String(row.title),
    featured: row.featured === true,
    tags,
    author: author ? {
      id: typeof author.id === "string" ? author.id : undefined,
      name: typeof author.display_name === "string" ? author.display_name : "معتز العلقمي",
      role: typeof author.role === "string" ? author.role : undefined,
      avatar: typeof author.avatar_url === "string" ? author.avatar_url : undefined,
    } : undefined,
    contentHtml: typeof row.content_html === "string" ? row.content_html : "",
    externalUrl: typeof row.external_url === "string" ? row.external_url : null,
  };
}

async function mapRows(rows: Row[]) {
  const supabase = await createClient();
  const publicUrl = (bucket: string, path: string) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return rows.map((row) => mapPostRow(row, publicUrl));
}

export const postsRepository = {
  async listPublished({ page = 1, pageSize = 12, type, categoryId }: Pick<ListFilters, "page" | "pageSize" | "type" | "categoryId"> = {}) {
    const supabase = await createClient();
    const from = Math.max(0, page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("posts")
      .select(POST_SELECT, { count: "exact" })
      .eq("status", "published")
      .is("deleted_at", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .range(from, to);

    if (type) query = query.eq("type", type);
    if (categoryId) {
      query = query.eq("post_categories.category_id", categoryId);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(`PUBLIC_POSTS_QUERY_FAILED: ${error.message}`);
    return { posts: await mapRows((data ?? []) as Row[]), count: count ?? 0, page, pageSize };
  },

  async getPublishedBySlug(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) throw new Error(`PUBLIC_POST_QUERY_FAILED: ${error.message}`);
    if (!data) return null;
    return (await mapRows([data as Row]))[0] ?? null;
  },

  async getFeatured() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .eq("featured", true)
      .is("deleted_at", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`FEATURED_POST_QUERY_FAILED: ${error.message}`);
    return data ? (await mapRows([data as Row]))[0] ?? null : null;
  },

  async getRelated(postId: string, categoryId: string | null, limit = 3) {
    const supabase = await createClient();
    let query = supabase
      .from("posts")
      .select(POST_SELECT)
      .neq("id", postId)
      .eq("status", "published")
      .is("deleted_at", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(limit);
    if (categoryId) query = query.eq("post_categories.category_id", categoryId);
    const { data, error } = await query;
    if (error) throw new Error(`RELATED_POSTS_QUERY_FAILED: ${error.message}`);
    return mapRows((data ?? []) as Row[]);
  },

  async listAdmin(filters: ListFilters = {}) {
    const { page = 1, pageSize = 25, search, type, status, categoryId, authorId } = filters;
    const supabase = await createClient();
    const from = Math.max(0, page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("posts")
      .select(POST_SELECT, { count: "exact" })
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .range(from, to);
    if (search) query = query.ilike("title", `%${search.replace(/[%_]/g, "\\$&")}%`);
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (authorId) query = query.eq("author_id", authorId);
    if (categoryId) query = query.eq("post_categories.category_id", categoryId);
    const { data, error, count } = await query;
    if (error) throw new Error(`ADMIN_POSTS_QUERY_FAILED: ${error.message}`);
    return { posts: await mapRows((data ?? []) as Row[]), count: count ?? 0, page, pageSize };
  },

  async getAdminById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
    if (error) throw new Error(`ADMIN_POST_QUERY_FAILED: ${error.message}`);
    return data as Row | null;
  },

  async ensureUniqueSlug(input: string, currentId?: string) {
    const supabase = await createClient();
    const base = slugify(input);
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const candidate = slugCandidate(base, attempt);
      let query = supabase.from("posts").select("id").eq("slug", candidate).limit(1);
      if (currentId) query = query.neq("id", currentId);
      const { data, error } = await query;
      if (error) throw new Error(`SLUG_CHECK_FAILED: ${error.message}`);
      if (!data?.length) return candidate;
    }
    throw new Error("SLUG_EXHAUSTED");
  },

  async deriveStoredContent(contentJson: JSONContent) {
    return {
      content_json: contentJson,
      content_html: renderContentJson(contentJson),
      content_text: contentJsonToText(contentJson),
    };
  },
};
