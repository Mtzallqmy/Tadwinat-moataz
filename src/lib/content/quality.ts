import type { JSONContent } from "@tiptap/core";
import type { PostReference } from "@/types/content";

export function countWords(text: string) { return text.trim() ? text.trim().split(/\s+/u).filter(Boolean).length : 0; }
export function readingMinutes(text: string) { return Math.max(1, Math.ceil(countWords(text) / 200)); }
export function generateExcerpt(text: string, max = 220) {
  const clean = text.replace(/\s+/gu, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const boundary = cut.lastIndexOf(" ");
  return `${cut.slice(0, boundary > max * 0.6 ? boundary : max).trim()}…`;
}

function collectHeadings(node: JSONContent, out: number[] = []) {
  if (node.type === "heading" && typeof node.attrs?.level === "number") out.push(node.attrs.level);
  node.content?.forEach((child) => collectHeadings(child, out));
  return out;
}
export function headingWarnings(doc: JSONContent) {
  const levels = collectHeadings(doc);
  const warnings: string[] = [];
  if (levels.includes(1)) warnings.push("عنوان المقال هو H1؛ استخدم H2/H3 داخل النص.");
  for (let i = 1; i < levels.length; i += 1) if (levels[i] - levels[i - 1] > 1) { warnings.push("يوجد قفز غير منطقي في تسلسل العناوين."); break; }
  return warnings;
}

export function buildQualityChecklist(input: { title: string; excerpt: string; contentText: string; categoryCount: number; coverAlt?: string; coverId?: string | null; seoDescription?: string | null; references?: PostReference[]; contentHtml?: string }) {
  return [
    { label: "العنوان", ok: Boolean(input.title.trim()) },
    { label: "الوصف", ok: Boolean(input.excerpt.trim()) },
    { label: "التصنيف", ok: input.categoryCount > 0 },
    { label: "الصورة", ok: Boolean(input.coverId) },
    { label: "Meta Description", ok: Boolean(input.seoDescription?.trim() || input.excerpt.trim()) },
    { label: "روابط داخل المحتوى", ok: /<a\s/i.test(input.contentHtml ?? "") },
    { label: "Alt لصورة الغلاف", ok: !input.coverId || Boolean(input.coverAlt?.trim()) },
    { label: "مراجع", ok: Boolean(input.references?.length) },
    { label: "طول مناسب للقراءة", ok: countWords(input.contentText) >= 250 },
  ];
}
