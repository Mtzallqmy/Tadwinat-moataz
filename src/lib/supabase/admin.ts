import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
export function createAdminClient(){const{url}=getSupabasePublicEnv();const secret=process.env.SUPABASE_SECRET_KEY;if(!secret||secret.includes("placeholder"))throw new Error("SUPABASE_SECRET_KEY_NOT_CONFIGURED");return createClient(url,secret,{db:{schema:"blog"},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
