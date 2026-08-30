"use client";

import type { ReactNode } from "react";
import { Check, Copy, Send, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => window.location.href;
  const open = (url: string): void => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  async function copyLink() {
    await navigator.clipboard.writeText(currentUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url: currentUrl() });
      return;
    }
    await copyLink();
  }

  const encoded = () => encodeURIComponent(currentUrl());

  return (
    <div id="share" className="relative flex flex-wrap gap-2">
      <ShareButton label="Telegram" onClick={() => open(`https://t.me/share/url?url=${encoded()}&text=${encodeURIComponent(title)}`)}><Send className="size-4" /></ShareButton>
      <ShareButton label="WhatsApp" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${currentUrl()}`)}`)}><span className="text-xs font-black">WA</span></ShareButton>
      <ShareButton label="X" onClick={() => open(`https://x.com/intent/post?url=${encoded()}&text=${encodeURIComponent(title)}`)}><span className="text-sm font-black">𝕏</span></ShareButton>
      <ShareButton label="Facebook" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encoded()}`)}><span className="text-xs font-black">f</span></ShareButton>
      <ShareButton label={copied ? "تم النسخ" : "نسخ الرابط"} onClick={copyLink}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</ShareButton>
      <ShareButton label="مشاركة" onClick={share}><Share2 className="size-4" /></ShareButton>
      {copied ? <span role="status" className="absolute -bottom-10 right-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-[var(--shadow-card)]">✓ تم نسخ الرابط</span> : null}
    </div>
  );
}

function ShareButton({ label, onClick, children }: { label: string; onClick: () => void | Promise<void>; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-bold hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {children}{label}
    </button>
  );
}
