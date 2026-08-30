"use server";

import type { JSONContent } from "@tiptap/core";
import { revalidatePath } from "next/cache";
import { assertCmsUser, hasCapability } from "@/lib/auth/authorization";
import { postsRepository } from "@/lib/repositories/posts";
import { postInputSchema } from "@/lib/validation/content";
import { createClient } from "@/lib/supabase/server";

export interface SavePostPayload {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  type: "article" | "note" | "diary" | "story" | "link" | "page";
  status: "draft" | "review" | "scheduled" | "published" | "archived";
  contentJson: JSONContent;
  coverImageId?: string | null;
  externalUrl?: string | null;
  featured?: boolean;
  categoryIds?: string[];
  primaryCategoryId?: string | null;
  tagIds?: string[];
  scheduledAt?: string | null;
  revisionSource?: "manual" | "autosave" | "publish";
}

export type SavePostResult =
  | { ok: true; id: string; slug: string; savedAt: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function savePostAction(payload: SavePostPayload): Promise<SavePostResult> {
  const user = await assertCmsUser("content.create");
  const parsed = postInputSchema.safeParse({
    ...payload,
    excerpt: payload.excerpt ?? "",
    categoryIds: payload.categoryIds ?? [],
    tagIds: payload.tagIds ?? [],
    featured: payload.featured ?? false,
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return { ok: false, error: "تحقق من الحقول المطلوبة.", fieldErrors: flattened.fieldErrors as Record<string, string[]> };
  }

  if (["published", "scheduled"].includes(parsed.data.status) && !hasCapability(user.role, "content.publish")) {
    return { ok: false, error: "ليست لديك صلاحية النشر." };
  }

  try {
    const slug = await postsRepository.ensureUniqueSlug(
      parsed.data.slug || parsed.data.title,
      parsed.data.id,
    );
    const stored = await postsRepository.deriveStoredContent(parsed.data.contentJson as JSONContent);
    const supabase = await createClient();
    const revisionSource = payload.revisionSource ?? (parsed.data.status === "published" ? "publish" : "manual");

    const { data, error } = await supabase.rpc("cms_save_post", {
      p_id: parsed.data.id ?? null,
      p_title: parsed.data.title,
      p_slug: slug,
      p_excerpt: parsed.data.excerpt,
      p_type: parsed.data.type,
      p_status: parsed.data.status,
      p_content_json: stored.content_json,
      p_content_html: stored.content_html,
      p_content_text: stored.content_text,
      p_cover_image_id: parsed.data.coverImageId ?? null,
      p_external_url: parsed.data.externalUrl ?? null,
      p_featured: parsed.data.featured,
      p_scheduled_at: parsed.data.scheduledAt ?? null,
      p_category_ids: parsed.data.categoryIds,
      p_primary_category_id: parsed.data.primaryCategoryId ?? null,
      p_tag_ids: parsed.data.tagIds,
      p_revision_source: revisionSource,
    });

    if (error || typeof data !== "string") {
      console.error("[cms] save post failed", { code: error?.code, message: error?.message });
      return { ok: false, error: "تعذر حفظ المحتوى. حاول مرة أخرى." };
    }

    revalidatePath("/", "layout");
    revalidatePath("/posts");
    revalidatePath(`/posts/${slug}`);
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${data}/edit`);

    return { ok: true, id: data, slug, savedAt: new Date().toISOString() };
  } catch (error) {
    console.error("[cms] save post exception", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "تعذر حفظ المحتوى. حاول مرة أخرى." };
  }
}

export async function archivePostAction(id: string) {
  const user = await assertCmsUser("content.create");
  const post = await postsRepository.getAdminById(id);
  if (!post) return { ok: false, error: "المحتوى غير موجود." } as const;

  if (user.role === "author" && post.author_id !== user.id) {
    return { ok: false, error: "لا يمكنك أرشفة محتوى مستخدم آخر." } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: "تعذر أرشفة المحتوى." } as const;
  await supabase.from("audit_logs").insert({ user_id: user.id, action: "archive_post", entity_type: "post", entity_id: id, metadata: {} });
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
  return { ok: true } as const;
}
