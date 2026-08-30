import type { JSONContent } from "@tiptap/core";
import type { EditorInitialPost } from "@/types/editor";

type Row = Record<string, unknown>;

function asObject(value: unknown): Row | null {
  return value && typeof value === "object" ? (value as Row) : null;
}

function asRelation(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

export function editorInitialFromRow(row: Row): EditorInitialPost {
  const categories = asRelation(row.post_categories);
  const tags = asRelation(row.post_tags);
  const references = asRelation(row.post_references);
  const faqs = asRelation(row.post_faqs);

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    excerpt: String(row.excerpt ?? ""),
    type: row.type as EditorInitialPost["type"],
    status: row.status as EditorInitialPost["status"],
    contentJson: (asObject(row.content_json) as JSONContent | null) ?? { type: "doc", content: [{ type: "paragraph" }] },
    coverImageId: typeof row.cover_image_id === "string" ? row.cover_image_id : null,
    externalUrl: typeof row.external_url === "string" ? row.external_url : null,
    featured: row.featured === true,
    categoryIds: categories
      .map((item) => asObject(item.category)?.id)
      .filter((id): id is string => typeof id === "string"),
    primaryCategoryId: (() => {
      const primary = categories.find((item) => item.is_primary === true);
      const id = asObject(primary?.category)?.id;
      return typeof id === "string" ? id : null;
    })(),
    tagIds: tags
      .map((item) => asObject(item.tag)?.id)
      .filter((id): id is string => typeof id === "string"),
    scheduledAt: typeof row.scheduled_at === "string" ? row.scheduled_at : null,
    summary: typeof row.summary === "string" ? row.summary : null,
    keyPoints: Array.isArray(row.key_points)
      ? row.key_points.filter((item): item is string => typeof item === "string")
      : [],
    seoTitle: typeof row.seo_title === "string" ? row.seo_title : null,
    seoDescription: typeof row.seo_description === "string" ? row.seo_description : null,
    canonicalUrl: typeof row.canonical_url === "string" ? row.canonical_url : null,
    robotsIndex: row.robots_index !== false,
    robotsFollow: row.robots_follow !== false,
    ogTitle: typeof row.og_title === "string" ? row.og_title : null,
    ogDescription: typeof row.og_description === "string" ? row.og_description : null,
    ogImageId: typeof row.og_image_id === "string" ? row.og_image_id : null,
    twitterTitle: typeof row.twitter_title === "string" ? row.twitter_title : null,
    twitterDescription: typeof row.twitter_description === "string" ? row.twitter_description : null,
    twitterImageId: typeof row.twitter_image_id === "string" ? row.twitter_image_id : null,
    focusKeyword: typeof row.focus_keyword === "string" ? row.focus_keyword : null,
    medicalReviewed: row.medical_reviewed === true,
    references: references.map((ref) => ({
      id: String(ref.id),
      title: String(ref.title),
      url: typeof ref.url === "string" ? ref.url : null,
      publisher: typeof ref.publisher === "string" ? ref.publisher : null,
      author: typeof ref.author === "string" ? ref.author : null,
      publishedDate: typeof ref.published_date === "string" ? ref.published_date : null,
      accessedAt: typeof ref.accessed_at === "string" ? ref.accessed_at : null,
      sortOrder: typeof ref.sort_order === "number" ? ref.sort_order : 0,
    })),
    faqs: faqs.map((faq) => ({
      id: String(faq.id),
      question: String(faq.question),
      answer: String(faq.answer),
      sortOrder: typeof faq.sort_order === "number" ? faq.sort_order : 0,
    })),
  };
}
