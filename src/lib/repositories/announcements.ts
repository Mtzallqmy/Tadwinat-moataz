import { announcements as fallbackAnnouncements } from "@/data/misc";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Announcement } from "@/types/content";

export const announcementsRepository = {
  async getActive(): Promise<Announcement | undefined> {
    if (!isSupabaseConfigured()) return fallbackAnnouncements[0];
    const supabase=createPublicClient();
    const {data,error}=await supabase.from("announcements").select("id,text,href,label,icon,dismissible").eq("is_active",true).or(`start_at.is.null,start_at.lte.${new Date().toISOString()}`).or(`end_at.is.null,end_at.gt.${new Date().toISOString()}`).order("priority",{ascending:false}).limit(1).maybeSingle();
    if(error) return undefined;
    return data?{id:String(data.id),text:String(data.text),href:typeof data.href==="string"?data.href:undefined,label:typeof data.label==="string"?data.label:undefined,icon:typeof data.icon==="string"?data.icon:undefined,dismissible:data.dismissible!==false}:undefined;
  },
};
