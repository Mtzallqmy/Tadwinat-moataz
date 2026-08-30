const FALLBACK_URL = "https://example.com";

export function normalizeSiteUrl(input?: string | null) {
  const value = input || process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL;
  try { return new URL(value).origin; } catch { return FALLBACK_URL; }
}

export function getAbsoluteUrl(path = "/", siteUrl?: string | null) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = normalizeSiteUrl(siteUrl);
  return new URL(path.startsWith("/") ? path : `/${path}`, `${base}/`).toString();
}

export function getPostPath(slug: string) { return `/posts/${encodeURIComponent(slug)}`; }
export function getCanonicalPostUrl(slug: string, custom?: string | null, siteUrl?: string | null) {
  return custom?.trim() ? getAbsoluteUrl(custom.trim(), siteUrl) : getAbsoluteUrl(getPostPath(slug), siteUrl);
}
