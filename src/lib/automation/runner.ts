import { createAdminClient } from "@/lib/supabase/admin";
import { AutomationError } from "@/lib/integrations/errors";
import { notifyOwners, postPublishedToChannel } from "@/lib/telegram/notifications";
import { createCampaign, sendCampaignBatch } from "@/lib/email/newsletter";

type AutomationEvent = "post.published" | "post.scheduled" | "post.failed" | "contact.received" | "newsletter.subscribed";
type AutomationAction = "telegram.notify_owner" | "telegram.post_channel" | "newsletter.send_article";
type Rule = { id: string; event: AutomationEvent; action: AutomationAction; config: Record<string, unknown> };
type Run = { id: string; rule_id: string; event: AutomationEvent; entity_id: string | null; attempt_count: number; metadata: Record<string, unknown> };

function idempotencyKey(event: AutomationEvent, entityId: string | null) {
  return `${event}:${entityId ?? "none"}`;
}

async function postSummary(postId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("posts").select("id,title,slug,excerpt,status").eq("id", postId).single();
  if (error || !data) throw new AutomationError("AUTOMATION_POST_NOT_FOUND");
  return data;
}

async function executeAction(rule: Rule, run: Run) {
  const supabase = createAdminClient();
  if (rule.action === "telegram.notify_owner") {
    if (run.event.startsWith("post.") && run.entity_id) {
      const post = await postSummary(run.entity_id);
      await notifyOwners(`🔔 ${post.title}\nالحالة: ${run.event}`);
      return {};
    }
    if (run.event === "contact.received" && run.entity_id) {
      const { data } = await supabase.from("contact_messages").select("name,subject").eq("id", run.entity_id).maybeSingle();
      await notifyOwners(`✉️ رسالة تواصل جديدة\n${data?.name ?? ""}\n${data?.subject ?? ""}`);
      return {};
    }
    await notifyOwners(`🔔 حدث: ${run.event}`);
    return {};
  }
  if (rule.action === "telegram.post_channel") {
    if (!run.entity_id) throw new AutomationError("AUTOMATION_ENTITY_REQUIRED");
    const post = await postSummary(run.entity_id);
    await postPublishedToChannel(post);
    return {};
  }
  if (rule.action === "newsletter.send_article") {
    if (!run.entity_id) throw new AutomationError("AUTOMATION_ENTITY_REQUIRED");
    const post = await postSummary(run.entity_id);
    let campaignId = typeof run.metadata.campaign_id === "string" ? run.metadata.campaign_id : null;
    if (!campaignId) {
      const ownerId = await (await import("@/lib/domain/publishing")).resolveOwnerProfileId();
      campaignId = await createCampaign({ subject: post.title, preheader: post.excerpt ?? "", body: `${post.excerpt ?? ""}\n\n${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/u, "")}/posts/${post.slug}`, createdBy: ownerId });
      await supabase.from("automation_runs").update({ metadata: { ...run.metadata, campaign_id: campaignId } }).eq("id", run.id);
    }
    const result = await sendCampaignBatch(campaignId);
    if (result.failed > 0 || !result.complete) throw new AutomationError(`NEWSLETTER_BATCH_INCOMPLETE:${result.remaining}:${result.failed}`);
    return { campaign_id: campaignId };
  }
  throw new AutomationError("UNKNOWN_AUTOMATION_ACTION");
}

async function executeRun(rule: Rule, run: Run) {
  const supabase = createAdminClient();
  try {
    const result = await executeAction(rule, run);
    await supabase.from("automation_runs").update({ status: "succeeded", finished_at: new Date().toISOString(), error_message: null, next_retry_at: null, metadata: { ...run.metadata, ...result } }).eq("id", run.id);
    return { ok: true as const, runId: run.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const nextRetry = run.attempt_count < 3 ? new Date(Date.now() + 2 ** (run.attempt_count - 1) * 60_000).toISOString() : null;
    await supabase.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: message.slice(0, 1000), next_retry_at: nextRetry }).eq("id", run.id);
    return { ok: false as const, runId: run.id, error: message };
  }
}

export async function runAutomations(event: AutomationEvent, entityId: string | null, metadata: Record<string, unknown> = {}) {
  const supabase = createAdminClient();
  const { data: rules, error } = await supabase.from("automation_rules").select("id,event,action,config").eq("event", event).eq("is_active", true);
  if (error) throw new AutomationError(`AUTOMATION_RULES_READ_FAILED: ${error.message}`);
  const results = [];
  for (const raw of rules ?? []) {
    const rule = raw as Rule;
    const key = idempotencyKey(event, entityId);
    const { data: inserted, error: insertError } = await supabase.from("automation_runs").insert({ rule_id: rule.id, event, entity_id: entityId, idempotency_key: key, status: "processing", attempt_count: 1, metadata }).select("id,rule_id,event,entity_id,attempt_count,metadata").single();
    if (insertError?.code === "23505") {
      const { data: existing } = await supabase.from("automation_runs").select("id,status").eq("rule_id", rule.id).eq("idempotency_key", key).maybeSingle();
      results.push({ ok: existing?.status === "succeeded", runId: existing?.id, skipped: true });
      continue;
    }
    if (insertError || !inserted) throw new AutomationError(`AUTOMATION_RUN_CREATE_FAILED: ${insertError?.message ?? "unknown"}`);
    results.push(await executeRun(rule, inserted as Run));
  }
  return results;
}

export async function retryDueAutomations(limit = 10) {
  const supabase = createAdminClient();
  const { data: runs, error } = await supabase.from("automation_runs").select("id,rule_id,event,entity_id,attempt_count,metadata").eq("status", "failed").lt("attempt_count", 3).lte("next_retry_at", new Date().toISOString()).order("next_retry_at", { ascending: true }).limit(limit);
  if (error) throw new AutomationError(`AUTOMATION_RETRY_READ_FAILED: ${error.message}`);
  const results = [];
  for (const raw of runs ?? []) {
    const run = raw as Run;
    const { data: ruleData } = await supabase.from("automation_rules").select("id,event,action,config,is_active").eq("id", run.rule_id).maybeSingle();
    if (!ruleData?.is_active) {
      await supabase.from("automation_runs").update({ status: "skipped", finished_at: new Date().toISOString(), error_message: "RULE_DISABLED", next_retry_at: null }).eq("id", run.id);
      continue;
    }
    const nextRun = { ...run, attempt_count: run.attempt_count + 1 };
    await supabase.from("automation_runs").update({ status: "processing", attempt_count: nextRun.attempt_count, started_at: new Date().toISOString(), finished_at: null }).eq("id", run.id);
    results.push(await executeRun(ruleData as Rule, nextRun));
  }
  return results;
}

export const automationInternals = { idempotencyKey };
