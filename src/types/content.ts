export type ContentType = "article" | "note" | "diary" | "story" | "link" | "page";
export interface Author { id?: string; name: string; role?: string; avatar?: string; }
export interface Category { id?: string; slug: string; name: string; description: string; icon: string; count: number; color?: string | null; parentId?: string | null; isActive?: boolean; }
export interface Tag { id?: string; slug: string; name: string; description?: string | null; }
export interface Post {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: Category["slug"];
  categories?: Category["slug"][];
  contentType: ContentType;
  status?: "draft" | "review" | "scheduled" | "published" | "archived";
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  views: number;
  cover: string;
  coverAlt?: string;
  featured?: boolean;
  tags: Tag["slug"][];
  author?: Author;
  contentHtml?: string;
  externalUrl?: string | null;
}
export interface Announcement { id: string; text: string; href?: string; label?: string; icon?: string; dismissible?: boolean; }
export interface LinkPost { id: string; title: string; domain: string; note: string; href: string; }
export interface DiaryEntry { id: string; date: string; title: string; excerpt: string; slug: string; }
export interface Note { id: string; text: string; date: string; }
export interface PopularPost { slug: string; title: string; category: Category["slug"]; views: number; }
