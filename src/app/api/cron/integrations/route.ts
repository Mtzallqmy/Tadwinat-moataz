import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendDueCampaigns } from "@/lib/email/newsletter";
import { retryDueAutomations } from "@/lib/automation/runner";
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
  const result: { newsletters?: unknown; automations?: unknown; errors: string[] } = { errors: [] };
  try { result.newsletters = await sendDueCampaigns(); } catch (error) { result.errors.push(`newsletter:${error instanceof Error ? error.message : "unknown"}`); }
  try { result.automations = await retryDueAutomations(); } catch (error) { result.errors.push(`automation:${error instanceof Error ? error.message : "unknown"}`); }
  const status = result.errors.length ? "partial" : "succeeded";
  await recordSystemJob({ jobName: "integrations", status, startedAt, summary: { newsletter: result.newsletters ?? null, automation: result.automations ?? null }, errorMessage: result.errors.join(" | ") || undefined });
  return NextResponse.json({ ok: result.errors.length === 0, ...result }, { status: result.errors.length ? 207 : 200 });
}
