import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSystemJob } from "@/lib/operations/job-runs";

function authorized(header: string | null, secret: string) {
  if (!header?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: NextRequest) {
  const startedAt = new Date();
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.includes("placeholder")) return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("run_maintenance");
    if (error) throw error;
    const summary = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    await recordSystemJob({ jobName: "maintenance", status: "succeeded", startedAt, summary });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    await recordSystemJob({ jobName: "maintenance", status: "failed", startedAt, errorMessage: message });
    return NextResponse.json({ error: "Maintenance failed" }, { status: 500 });
  }
}
