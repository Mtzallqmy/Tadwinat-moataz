import { createClient } from "@/lib/supabase/server";

export type AuditAction =
  | "create_post"
  | "update_post"
  | "publish_post"
  | "archive_post"
  | "delete_post"
  | "restore_post"
  | "create_category"
  | "update_category"
  | "delete_category"
  | "create_tag"
  | "update_tag"
  | "delete_tag"
  | "upload_media"
  | "update_media"
  | "delete_media"
  | "update_menu"
  | "update_homepage"
  | "update_announcement"
  | "update_settings";

export async function writeAuditLog(input: {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert({
    user_id: input.userId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw new Error(`AUDIT_LOG_FAILED: ${error.message}`);
}
