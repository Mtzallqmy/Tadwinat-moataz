"use server";

import { revalidatePath } from "next/cache";
import { assertCmsUser } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export async function updateContactMessageStatusAction(formData: FormData) {
  await assertCmsUser("settings.manage");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["new","read","replied","archived"].includes(status)) throw new Error("INVALID_MESSAGE_STATUS");
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
}
