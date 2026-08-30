export type ContentType = "article" | "note" | "diary" | "story" | "link" | "page";
export type PostStatus = "draft" | "review" | "scheduled" | "published" | "archived";

export interface Author { id?: string; name: string; role?: string; avatar?: string; bio?: string; }
export interface Category { id?: string; slug: string; name: string; description: string; icon: string; count: number; color?: string | null; parentId?: string | null; isActive?: boolean; }
export interface Tag { id?: string; slug: string; name: string; description?: string | null; }
export interface PostReference { id?: string; title: string; url?: string | null; publisher?: string | null; author?: string | null; publishedDate?: string | null; accessedAt?: string | null; sortOrder?: number; }
export interface PostFaq { id?: string; question: string; answer: string; sortOrder?: number; }
export interface SeoFields {
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageId?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageId?: string | null;
  twitterImage?: string | null;
  focusKeyword?: string | null;
}
export interface Post extends SeoFields {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  summary?: string | null;
  keyPoints?: string[];
  category: Category["slug"];
  categoryName?: string;
  categories?: Category["slug"][];
  contentType: ContentType;
  status?: PostStatus;
  publishedAt: string;
  scheduledAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
  readingMinutes: number;
  wordCount?: number;
  views: number;
  cover: string;
  coverImageId?: string | null;
  coverAlt?: string;
  featured?: boolean;
  tags: Tag["slug"][];
  author?: Author;
  contentHtml?: string;
  contentText?: string;
  contentJson?: Record<string, unknown>;
  externalUrl?: string | null;
  references?: PostReference[];
  faqs?: PostFaq[];
  medicalReviewed?: boolean;
  lastPublishError?: string | null;
  publishAttempts?: number;
}
export interface Announcement { id: string; text: string; href?: string; label?: string; icon?: string; dismissible?: boolean; }
export interface LinkPost { id: string; title: string; domain: string; note: string; href: string; }
export interface DiaryEntry { id: string; date: string; title: string; excerpt: string; slug: string; }
export interface Note { id: string; text: string; date: string; }
export interface PopularPost { slug: string; title: string; category: Category["slug"]; views: number; }

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  authorName: string;
  authorBio: string;
  publisherName: string;
  timezone: string;
  defaultIndexing: boolean;
  indexTagPages: boolean;
  defaultOgImage?: string | null;
  twitterHandle?: string | null;
  telegramUrl?: string | null;
  xUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
}
