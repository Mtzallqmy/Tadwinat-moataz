import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePublishing } from "@/lib/cache/revalidation";

function authorized(header: string | null, secret: string) {
  if (!header?.startsWith("Bearer ")) return false;
  const value = header.slice(7);
  const actual = Buffer.from(value);
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.includes("placeholder")) {
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  }

  if (!authorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("publish_due_posts", { p_limit: 50 });
    if (error) throw error;

    const published = Array.isArray(data) ? data : [];
    for (const row of published) {
      if (row && typeof row.slug === "string") {
        await revalidatePublishing({ slug: row.slug });
      }
    }

    return NextResponse.json({
      ok: true,
      published: published.length,
      posts: published.map((row) => ({
        id: row.id,
        slug: row.slug,
        publishedAt: row.published_at,
      })),
    });
  } catch (error) {
    console.error("[cron] scheduled publishing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Scheduled publishing failed" }, { status: 500 });
  }
}
