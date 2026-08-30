import type { JSONContent } from "@tiptap/core";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { renderContentJson, contentJsonToText } from "@/lib/content/render";
import { slugify } from "@/lib/content/slug";
import { runAutomations } from "@/lib/automation/runner";

type ClientMode = "session" | "system";
type PostType = "article" | "note" | "diary" | "story" | "link" | "page";

async function clientFor(mode: ClientMode) { return mode === "system" ? createAdminClient() : await createClient(); }

async function uniqueSlug(base: string, mode: ClientMode) {
  const client = await clientFor(mode);
  const root = slugify(base);
  for (let attempt = 1; attempt <= 100; attempt += 1) {
    const candidate = attempt === 1 ? root : `${root}-${attempt}`;
    const { data, error } = await client.from("posts").select("id").eq("slug", candidate).limit(1);
    if (error) throw new Error(`SLUG_CHECK_FAILED: ${error.message}`);
    if (!data?.length) return candidate;
  }
  throw new Error("SLUG_EXHAUSTED");
}

export async function resolveOwnerProfileId() {
  const client = createAdminClient();
  const { data, error } = await client.from("profiles").select("id").eq("role", "owner").eq("is_active", true).limit(1).maybeSingle();
  if (error || !data?.id) throw new Error("OWNER_PROFILE_NOT_CONFIGURED");
  return data.id as string;
}

export async function createDraft(input: { title: string; text: string; type?: PostType; externalUrl?: string | null; authorId?: string; source?: string }) {
  const client = createAdminClient();
  const authorId = input.authorId ?? await resolveOwnerProfileId();
  const contentJson: JSONContent = { type: "doc", content: [{ type: "paragraph", content: input.text ? [{ type: "text", text: input.text }] : undefined }] };
  const contentHtml = renderContentJson(contentJson);
  const contentText = contentJsonToText(contentJson);
  const slug = await uniqueSlug(input.title, "system");
  const { data, error } = await client.from("posts").insert({ author_id: authorId, type: input.type ?? "article", status: "draft", title: input.title.trim(), slug, excerpt: contentText.slice(0, 240), content_json: contentJson, content_html: contentHtml, content_text: contentText, external_url: input.externalUrl ?? null }).select("id,slug,title").single();
  if (error) throw new Error(`CREATE_DRAFT_FAILED: ${error.message}`);
  await client.from("audit_logs").insert({ user_id: authorId, action: "create_post", entity_type: "post", entity_id: data.id, metadata: { source: input.source ?? "system" } });
  return data;
}

export async function publishPost(postId: string, options: { mode?: ClientMode; actorId?: string; source?: string } = {}) {
  const mode = options.mode ?? "system";
  const client = await clientFor(mode);
  const { data: post, error: readError } = await client.from("posts").select("id,slug,title,published_at,status").eq("id", postId).maybeSingle();
  if (readError || !post) throw new Error("POST_NOT_FOUND");
  if (post.status === "published") return post;
  const publishedAt = post.published_at ?? new Date().toISOString();
  const { data, error } = await client.from("posts").update({ status: "published", published_at: publishedAt, scheduled_at: null, last_publish_error: null }).eq("id", postId).select("id,slug,title,published_at,status").single();
  if (error) throw new Error(`PUBLISH_FAILED: ${error.message}`);
  if (options.actorId) await client.from("audit_logs").insert({ user_id: options.actorId, action: "publish_post", entity_type: "post", entity_id: postId, metadata: { source: options.source ?? mode } });
  void runAutomations("post.published", postId, { source: options.source ?? mode }).catch((automationError) => console.error("[automation] post.published failed", automationError instanceof Error ? automationError.message : "unknown"));
  return data;
}

export async function schedulePost(postId: string, scheduledAt: string, options: { mode?: ClientMode; actorId?: string; source?: string } = {}) {
  if (!Number.isFinite(Date.parse(scheduledAt)) || new Date(scheduledAt) <= new Date()) throw new Error("INVALID_SCHEDULE_TIME");
  const mode = options.mode ?? "system";
  const client = await clientFor(mode);
  const { data, error } = await client.from("posts").update({ status: "scheduled", scheduled_at: scheduledAt, published_at: null, last_publish_error: null, publish_attempts: 0 }).eq("id", postId).select("id,slug,title,scheduled_at,status").single();
  if (error) throw new Error(`SCHEDULE_FAILED: ${error.message}`);
  if (options.actorId) await client.from("audit_logs").insert({ user_id: options.actorId, action: "schedule_post", entity_type: "post", entity_id: postId, metadata: { source: options.source ?? mode, scheduled_at: scheduledAt } });
  void runAutomations("post.scheduled", postId, { source: options.source ?? mode, scheduled_at: scheduledAt }).catch((automationError) => console.error("[automation] post.scheduled failed", automationError instanceof Error ? automationError.message : "unknown"));
  return data;
}

export async function cancelSchedule(postId: string, options: { mode?: ClientMode; actorId?: string; source?: string } = {}) {
  const mode = options.mode ?? "system";
  const client = await clientFor(mode);
  const { data, error } = await client.from("posts").update({ status: "draft", scheduled_at: null, last_publish_error: null, publish_attempts: 0 }).eq("id", postId).select("id,slug,title,status").single();
  if (error) throw new Error(`CANCEL_SCHEDULE_FAILED: ${error.message}`);
  if (options.actorId) await client.from("audit_logs").insert({ user_id: options.actorId, action: "cancel_scheduled_post", entity_type: "post", entity_id: postId, metadata: { source: options.source ?? mode } });
  return data;
}

export async function archivePost(postId: string, options: { mode?: ClientMode; actorId?: string; source?: string } = {}) {
  const mode = options.mode ?? "system";
  const client = await clientFor(mode);
  const { data, error } = await client.from("posts").update({ status: "archived", archived_at: new Date().toISOString(), scheduled_at: null }).eq("id", postId).select("id,slug,title,status").single();
  if (error) throw new Error(`ARCHIVE_FAILED: ${error.message}`);
  if (options.actorId) await client.from("audit_logs").insert({ user_id: options.actorId, action: "archive_post", entity_type: "post", entity_id: postId, metadata: { source: options.source ?? mode } });
  return data;
}
