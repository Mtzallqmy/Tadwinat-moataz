"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="inline-flex size-10 rounded-full border border-border bg-card" aria-hidden="true" />;
  const dark = resolvedTheme === "dark";
  return <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}>{dark ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}</button>;
}
