import type { JSONContent } from "@tiptap/core";
import type { ContentType, PostFaq, PostReference, PostStatus } from "@/types/content";

export interface EditorInitialPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  type: ContentType;
  status: PostStatus;
  contentJson: JSONContent;
  coverImageId?: string | null;
  externalUrl?: string | null;
  featured: boolean;
  categoryIds: string[];
  primaryCategoryId?: string | null;
  tagIds: string[];
  scheduledAt?: string | null;
  summary?: string | null;
  keyPoints: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageId?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageId?: string | null;
  focusKeyword?: string | null;
  medicalReviewed: boolean;
  references: PostReference[];
  faqs: PostFaq[];
}
