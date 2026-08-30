import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createPublicClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createSupabaseClient(url, publishableKey, {
    db: { schema: "blog" },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
