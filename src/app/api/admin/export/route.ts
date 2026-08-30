import { NextResponse } from "next/server";
import { getCurrentCmsUser } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

async function readAll(supabase: ReturnType<typeof createAdminClient>, table: string) {
  const pageSize = 500;
  const rows: unknown[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

export async function GET() {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createAdminClient();
  const [posts, categories, tags, settings] = await Promise.all([
    readAll(supabase, "posts"),
    readAll(supabase, "categories"),
    readAll(supabase, "tags"),
    readAll(supabase, "site_settings"),
  ]);
  const body = JSON.stringify({ schema: "moataz-blog-export-v1", exportedAt: new Date().toISOString(), posts, categories, tags, settings }, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="moataz-export-${date}.json"`, "Cache-Control": "private, no-store" } });
}
