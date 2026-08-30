const CACHE_NAME = "moataz-public-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png", "/icon.svg"];

const sensitivePrefixes = ["/admin", "/auth", "/api", "/preview", "/newsletter"];
const isSensitive = (pathname) => sensitivePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
const isPublicReadingRoute = (pathname) => pathname === "/" || pathname.startsWith("/posts/") || pathname.startsWith("/category/") || pathname === "/archive" || pathname === "/about" || pathname === "/privacy" || pathname === "/disclaimer";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isSensitive(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && isPublicReadingRoute(url.pathname)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        return cached || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || ["style", "font", "image"].includes(request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
