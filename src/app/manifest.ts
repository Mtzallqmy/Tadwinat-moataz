import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "معتز العلقمي",
    short_name: "معتز",
    description: "منصة عربية شخصية للنشر والمعرفة والتدوين.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f7f3",
    theme_color: "#22272d",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
