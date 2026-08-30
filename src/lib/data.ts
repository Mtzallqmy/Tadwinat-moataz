import { categories, categoryBySlug } from "@/data/categories";
import { announcements, curatedLinks, diaries, notes, popularPosts } from "@/data/misc";
import { posts } from "@/data/posts";
import type { ContentType } from "@/types/content";

export const contentRepository = {
  getPosts: () => posts,
  getLatestPosts: (limit = 6) => posts.slice(0, limit),
  getFeaturedPost: () => posts.find((post) => post.featured) ?? posts[0],
  getPostBySlug: (slug: string) => posts.find((post) => post.slug === slug),
  getPostsByCategory: (slug: string, limit?: number) => { const result = posts.filter((post) => post.category === slug); return typeof limit === "number" ? result.slice(0, limit) : result; },
  getPostsByType: (type: ContentType) => posts.filter((post) => post.contentType === type),
  getRelatedPosts: (slug: string, category: string, limit = 3) => posts.filter((post) => post.slug !== slug && post.category === category).slice(0, limit),
  getCategories: () => categories,
  getCategory: (slug: string) => categoryBySlug.get(slug),
  getAnnouncements: () => announcements,
  getNotes: () => notes,
  getDiaries: () => diaries,
  getLinks: () => curatedLinks,
  getPopularPosts: () => popularPosts,
};
