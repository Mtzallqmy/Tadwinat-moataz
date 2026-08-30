"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Announcement } from "@/types/content";

export function AnnouncementBar({ announcement }: { announcement?: Announcement }) {
  const [visible, setVisible] = useState(true);
  if (!announcement || !visible) return null;

  return (
    <div className="border-b border-primary/10 bg-primary/[0.07] text-sm text-foreground">
      <div className="relative mx-auto flex min-h-9 max-w-[var(--container)] items-center justify-center gap-2 px-4 py-2 text-center sm:px-6">
        <span>{announcement.text}</span>
        {announcement.href && announcement.label ? (
          <Link href={announcement.href} className="font-semibold text-primary underline-offset-4 hover:underline">
            {announcement.label}
          </Link>
        ) : null}
        {announcement.dismissible ? (
          <button
            className="absolute left-2 inline-flex size-8 items-center justify-center rounded-full hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:left-4"
            type="button"
            onClick={() => setVisible(false)}
            aria-label="إغلاق التنبيه"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
