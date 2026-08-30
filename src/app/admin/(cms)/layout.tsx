import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireCmsUser } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireCmsUser("content.read");

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminSidebar />
      <div className="min-h-screen lg:pr-64">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/90 px-4 pr-16 backdrop-blur-xl sm:px-6 sm:pr-16 lg:px-8 lg:pr-8">
          <div>
            <p className="text-sm font-black">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold hover:bg-accent">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">عرض الموقع</span>
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold hover:bg-accent">
                <LogOut className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function roleLabel(role: string) {
  return ({ owner: "المالك", admin: "مدير", editor: "محرر", author: "كاتب", reviewer: "مراجع" } as Record<string, string>)[role] ?? role;
}
