"use client";
import type { ReactNode } from "react";
import { Check,Copy,Mail,Send,Share2 } from "lucide-react";
import { useState } from "react";
export type ShareEvent={name:"share_click"|"copy_link";channel?:string;url:string};
export function ShareActions({title,canonicalUrl,onTrack}:{title:string;canonicalUrl:string;onTrack?:(event:ShareEvent)=>void}){
 const[copied,setCopied]=useState(false);const url=()=>canonicalUrl||window.location.href;const track=(name:ShareEvent["name"],channel?:string)=>onTrack?.({name,channel,url:url()});
 const open=(target:string,channel:string)=>{track("share_click",channel);window.open(target,"_blank","noopener,noreferrer");};
 async function copyLink(){await navigator.clipboard.writeText(url());track("copy_link","copy");setCopied(true);window.setTimeout(()=>setCopied(false),1800);}
 async function share(){if(navigator.share){track("share_click","native");await navigator.share({title,url:url()});return;}await copyLink();}
 const encoded=()=>encodeURIComponent(url());
 return <div id="share" className="relative flex flex-wrap gap-2">
  <ShareButton label="Telegram" onClick={()=>open(`https://t.me/share/url?url=${encoded()}&text=${encodeURIComponent(title)}`,"telegram")}><Send className="size-4"/></ShareButton>
  <ShareButton label="WhatsApp" onClick={()=>open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`,"whatsapp")}><span className="text-xs font-black">WA</span></ShareButton>
  <ShareButton label="X" onClick={()=>open(`https://x.com/intent/post?url=${encoded()}&text=${encodeURIComponent(title)}`,"x")}><span className="text-sm font-black">𝕏</span></ShareButton>
  <ShareButton label="Facebook" onClick={()=>open(`https://www.facebook.com/sharer/sharer.php?u=${encoded()}`,"facebook")}><span className="text-xs font-black">f</span></ShareButton>
  <ShareButton label="البريد" onClick={()=>{track("share_click","email");window.location.href=`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${url()}`)}`;}}><Mail className="size-4"/></ShareButton>
  <ShareButton label={copied?"تم النسخ":"نسخ الرابط"} onClick={copyLink}>{copied?<Check className="size-4"/>:<Copy className="size-4"/>}</ShareButton>
  <ShareButton label="مشاركة" onClick={share}><Share2 className="size-4"/></ShareButton>
  {copied?<span role="status" className="absolute -bottom-10 right-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-[var(--shadow-card)]">✓ تم نسخ الرابط</span>:null}
 </div>;
}
function ShareButton({label,onClick,children}:{label:string;onClick:()=>void|Promise<void>;children:ReactNode}){return <button type="button" aria-label={label} onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-bold hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}{label}</button>;}
