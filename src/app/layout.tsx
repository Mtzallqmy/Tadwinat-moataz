import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import type { ReactNode } from "react";

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "معتز العلقمي | أفكار ومعرفة وتدوين",
    template: "%s | معتز العلقمي",
  },
  description: "منصة شخصية للنشر والمعرفة والتدوين",
  openGraph: {
    type: "website",
    locale: "ar",
    siteName: "معتز العلقمي",
    title: "معتز العلقمي | أفكار ومعرفة وتدوين",
    description: "منصة شخصية للنشر والمعرفة والتدوين",
  },
  twitter: {
    card: "summary_large_image",
    title: "معتز العلقمي | أفكار ومعرفة وتدوين",
    description: "منصة شخصية للنشر والمعرفة والتدوين",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${arabicFont.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
