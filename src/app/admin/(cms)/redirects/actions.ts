"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

const redirectSchema = z.object({
  sourcePath: z.string().trim().min(1).max(2000).refine((value) => value.startsWith("/") && !value.startsWith("//"), "المصدر يجب أن يكون مسارًا داخليًا."),
  destinationUrl: z.string().trim().min(1).max(2000).refine((value) => value.startsWith("/") && !value.startsWith("//"), "الوجهة يجب أن تكون مسارًا داخليًا."),
  statusCode: z.coerce.number().int().refine((value) => [301, 302, 307, 308].includes(value), "كود التحويل غير صالح."),
}).refine((data) => data.sourcePath !== data.destinationUrl, { message: "لا يمكن التحويل إلى نفس المسار.", path: ["destinationUrl"] });

export async function createRedirectAction(formData: FormData) {
  const user = await assertCmsUser("content.publish");
  const parsed = redirectSchema.safeParse({
    sourcePath: formData.get("sourcePath"),
    destinationUrl: formData.get("destinationUrl"),
    statusCode: formData.get("statusCode"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة." } as const;

  const supabase = await createClient();
  const { error } = await supabase.from("redirects").insert({
    source_path: parsed.data.sourcePath,
    destination_url: parsed.data.destinationUrl,
    status_code: parsed.data.statusCode,
    is_active: true,
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.code === "23505" ? "يوجد تحويل لهذا المسار بالفعل." : "تعذر إنشاء التحويل." } as const;
  await supabase.from("audit_logs").insert({ user_id: user.id, action: "create_redirect", entity_type: "redirect", metadata: { source_path: parsed.data.sourcePath, destination_url: parsed.data.destinationUrl, status_code: parsed.data.statusCode } });
  revalidatePath("/admin/redirects");
  return { ok: true } as const;
}

export async function toggleRedirectAction(id: string, active: boolean) {
  const user = await assertCmsUser("content.publish");
  const supabase = await createClient();
  const { error } = await supabase.from("redirects").update({ is_active: active }).eq("id", id);
  if (error) throw new Error("REDIRECT_UPDATE_FAILED");
  await supabase.from("audit_logs").insert({ user_id: user.id, action: active ? "enable_redirect" : "disable_redirect", entity_type: "redirect", entity_id: id, metadata: {} });
  revalidatePath("/admin/redirects");
}

export async function deleteRedirectAction(id: string) {
  const user = await assertCmsUser("content.publish");
  const supabase = await createClient();
  const { error } = await supabase.from("redirects").delete().eq("id", id);
  if (error) throw new Error("REDIRECT_DELETE_FAILED");
  await supabase.from("audit_logs").insert({ user_id: user.id, action: "delete_redirect", entity_type: "redirect", entity_id: id, metadata: {} });
  revalidatePath("/admin/redirects");
}
