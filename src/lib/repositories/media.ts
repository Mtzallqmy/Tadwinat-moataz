import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export interface MediaItem {
  id: string;
  ownerId: string;
  bucket: "media" | "avatars";
  path: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string;
  caption: string | null;
  credit: string | null;
  url: string;
  createdAt: string;
  updatedAt: string;
}

function map(row: Row, publicUrl: (bucket: string, path: string) => string): MediaItem {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    bucket: row.bucket as MediaItem["bucket"],
    path: String(row.path),
    fileName: String(row.file_name),
    mimeType: String(row.mime_type),
    size: Number(row.size),
    width: typeof row.width === "number" ? row.width : null,
    height: typeof row.height === "number" ? row.height : null,
    altText: typeof row.alt_text === "string" ? row.alt_text : "",
    caption: typeof row.caption === "string" ? row.caption : null,
    credit: typeof row.credit === "string" ? row.credit : null,
    url: publicUrl(String(row.bucket), String(row.path)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export const mediaRepository = {
  async listAdmin({ page = 1, pageSize = 40, search = "" } = {}) {
    const supabase = await createClient();
    const from = Math.max(0, page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("media")
      .select("id, owner_id, bucket, path, file_name, mime_type, size, width, height, alt_text, caption, credit, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (search) query = query.ilike("file_name", `%${search.replace(/[%_]/g, "\\$&")}%`);
    const { data, error, count } = await query;
    if (error) throw new Error(`MEDIA_QUERY_FAILED: ${error.message}`);
    const publicUrl = (bucket: string, path: string) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return { items: (data ?? []).map((row) => map(row as Row, publicUrl)), count: count ?? 0, page, pageSize };
  },

  async getAdminById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`MEDIA_ITEM_QUERY_FAILED: ${error.message}`);
    if (!data) return null;
    return map(data as Row, (bucket, path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
  },
};
