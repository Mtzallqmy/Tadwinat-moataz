"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpenText,
  ChevronLeft,
  FileText,
  FolderTree,
  Home,
  ImageIcon,
  LayoutDashboard,
  Menu,
  PanelsTopLeft,
  Settings,
  Tags,
  X,
} from "lucide-react";

const sections = [
  {
    label: "عام",
    items: [
      { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/admin/content", label: "جميع المحتويات", icon: FileText },
      { href: "/admin/content?type=article", label: "المقالات", icon: BookOpenText },
      { href: "/admin/content?status=draft", label: "المسودات", icon: FileText },
    ],
  },
  {
    label: "تنظيم المحتوى",
    items: [
      { href: "/admin/categories", label: "الأقسام", icon: FolderTree },
      { href: "/admin/tags", label: "الوسوم", icon: Tags },
      { href: "/admin/media", label: "الوسائط", icon: ImageIcon },
    ],
  },
  {
    label: "المظهر",
    items: [
      { href: "/admin/appearance/homepage", label: "الرئيسية", icon: Home },
      { href: "/admin/appearance/menus", label: "القوائم", icon: PanelsTopLeft },
      { href: "/admin/announcements", label: "الإعلانات", icon: Bell },
      { href: "/admin/settings", label: "الإعدادات", icon: Settings },
    ],
  },
] as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground">م</span>
          <div>
            <p className="font-black">معتز العلقمي</p>
            <p className="text-xs text-muted-foreground">نظام إدارة المحتوى</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="تنقل لوحة التحكم">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">{section.label}</p>
            <div className="grid gap-1">
              {section.items.map((item) => {
                const active = item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href.split("?")[0]);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{item.label}</span>
                    <ChevronLeft className="mr-auto size-3.5 opacity-40" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-border bg-card lg:block">
        <SidebarBody />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-30 grid size-10 place-items-center rounded-xl border border-border bg-card shadow-sm lg:hidden"
        aria-label="فتح قائمة لوحة التحكم"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/35" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[min(86vw,320px)] border-l border-border bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-xl border border-border bg-background"
              aria-label="إغلاق القائمة"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
