export type ContentType = "article" | "note" | "diary" | "story" | "link";
export interface Author { name: string; role?: string; avatar?: string; }
export interface Category { slug: string; name: string; description: string; icon: string; count: number; }
export interface Tag { slug: string; name: string; }
export interface Post { slug: string; title: string; excerpt: string; category: Category["slug"]; contentType: ContentType; publishedAt: string; updatedAt?: string; readingMinutes: number; views: number; cover: string; featured?: boolean; tags: Tag["slug"][]; }
export interface Announcement { id: string; text: string; href?: string; label?: string; dismissible?: boolean; }
export interface LinkPost { id: string; title: string; domain: string; note: string; href: string; }
export interface DiaryEntry { id: string; date: string; title: string; excerpt: string; slug: string; }
export interface Note { id: string; text: string; date: string; }
export interface PopularPost { slug: string; title: string; category: Category["slug"]; views: number; }
