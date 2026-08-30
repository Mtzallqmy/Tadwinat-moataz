import { z } from "zod";

export const contentTypeSchema = z.enum(["article", "note", "diary", "story", "link", "page"]);
export const postStatusSchema = z.enum(["draft", "review", "scheduled", "published", "archived"]);

export const editorDocumentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()).optional(),
}).passthrough();

export const postInputSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1).max(240),
  slug: z.string().trim().min(1).max(220).optional(),
  excerpt: z.string().trim().max(1000).default(""),
  type: contentTypeSchema.default("article"),
  status: postStatusSchema.default("draft"),
  contentJson: editorDocumentSchema,
  coverImageId: z.uuid().nullable().optional(),
  externalUrl: z.url().nullable().optional(),
  featured: z.boolean().default(false),
  categoryIds: z.array(z.uuid()).max(12).default([]),
  primaryCategoryId: z.uuid().nullable().optional(),
  tagIds: z.array(z.uuid()).max(40).default([]),
  scheduledAt: z.iso.datetime({ offset: true }).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "link" && !data.externalUrl) {
    ctx.addIssue({ code: "custom", path: ["externalUrl"], message: "الرابط الخارجي مطلوب لهذا النوع." });
  }
  if (data.status === "scheduled" && !data.scheduledAt) {
    ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "حدد موعد النشر." });
  }
  if (data.primaryCategoryId && !data.categoryIds.includes(data.primaryCategoryId)) {
    ctx.addIssue({ code: "custom", path: ["primaryCategoryId"], message: "القسم الرئيسي يجب أن يكون ضمن أقسام المحتوى." });
  }
});

export const categoryInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1000).default(""),
  icon: z.string().trim().min(1).max(80).default("folder"),
  color: z.string().trim().max(40).nullable().optional(),
  parentId: z.uuid().nullable().optional(),
  sortOrder: z.coerce.number().int().min(-10000).max(10000).default(0),
  isActive: z.boolean().default(true),
});

export const tagInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const mediaMetadataSchema = z.object({
  id: z.uuid(),
  altText: z.string().trim().max(500),
  caption: z.string().trim().max(1000).nullable().optional(),
  credit: z.string().trim().max(500).nullable().optional(),
});
