import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const privatePrefixes = ["/admin", "/auth", "/api/preview", "/api/cron", "/api/telegram", "/api/admin"];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  if (privatePrefixes.some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`))) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|xml|txt|json)$).*)"] };
