"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Bold,
  CalendarClock,
  Code2,
  Eye,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Plus,
  Quote,
  Save,
  Send,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { savePostAction, type SavePostPayload } from "@/app/admin/(cms)/content/actions";
import { contentExtensions } from "@/lib/content/extensions";
import { buildQualityChecklist, countWords, headingWarnings, readingMinutes } from "@/lib/content/quality";
import { slugify } from "@/lib/content/slug";
import { zonedDateTimeToUtc } from "@/lib/datetime/timezone";
import type { MediaItem } from "@/lib/repositories/media";
import type { ContentType, PostFaq, PostReference, PostStatus } from "@/types/content";
import type { EditorInitialPost } from "@/types/editor";

type Option = { id: string; name: string; slug: string };
type RevisionSource = NonNullable<SavePostPayload["revisionSource"]>;

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const buttonPrimary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-50";
const buttonSecondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold hover:bg-accent disabled:opacity-50";

function zonedInput(iso: string | null | undefined, timeZone: string) {
  if (!iso) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function ContentEditor({
  initial,
  categories,
  tags,
  media,
  canPublish,
  timezone,
}: {
  initial?: EditorInitialPost;
  categories: Option[];
  tags: Option[];
  media: MediaItem[];
  canPublish: boolean;
  timezone: string;
}) {
  const router = useRouter();
  const [postId, setPostId] = useState(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [type, setType] = useState<ContentType>(initial?.type ?? "article");
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [coverImageId, setCoverImageId] = useState(initial?.coverImageId ?? "");
  const [externalUrl, setExternalUrl] = useState(initial?.externalUrl ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds ?? []);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(initial?.primaryCategoryId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [scheduleLocal, setScheduleLocal] = useState(zonedInput(initial?.scheduledAt, timezone));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [keyPoints, setKeyPoints] = useState((initial?.keyPoints ?? []).join("\n"));
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonicalUrl ?? "");
  const [robotsIndex, setRobotsIndex] = useState(initial?.robotsIndex ?? true);
  const [robotsFollow, setRobotsFollow] = useState(initial?.robotsFollow ?? true);
  const [ogTitle, setOgTitle] = useState(initial?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(initial?.ogDescription ?? "");
  const [ogImageId, setOgImageId] = useState(initial?.ogImageId ?? "");
  const [twitterTitle, setTwitterTitle] = useState(initial?.twitterTitle ?? "");
  const [twitterDescription, setTwitterDescription] = useState(initial?.twitterDescription ?? "");
  const [twitterImageId, setTwitterImageId] = useState(initial?.twitterImageId ?? "");
  const [focusKeyword, setFocusKeyword] = useState(initial?.focusKeyword ?? "");
  const [medicalReviewed, setMedicalReviewed] = useState(initial?.medicalReviewed ?? false);
  const [references, setReferences] = useState<PostReference[]>(initial?.references ?? []);
  const [faqs, setFaqs] = useState<PostFaq[]>(initial?.faqs ?? []);
  const [documentJson, setDocumentJson] = useState<JSONContent>(initial?.contentJson ?? emptyDoc);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...contentExtensions,
      Placeholder.configure({ placeholder: "ابدأ كتابة المحتوى…" }),
    ],
    content: initial?.contentJson ?? emptyDoc,
    editorProps: {
      attributes: {
        class: "cms-editor-content min-h-[52vh] outline-none",
        dir: "rtl",
        spellcheck: "true",
        "aria-label": "محرر المحتوى",
      },
    },
    onUpdate({ editor: currentEditor }) {
      setDocumentJson(currentEditor.getJSON());
      setDirty(true);
    },
  });

  const persist = useCallback(
    async (source: RevisionSource = "manual", statusOverride?: PostStatus) => {
      if (!editor || saving) return false;
      if (!title.trim()) {
        if (source !== "autosave") setMessage("أدخل عنوانًا قبل الحفظ.");
        return false;
      }

      setSaving(true);
      setMessage(source === "autosave" ? "حفظ تلقائي…" : "جارٍ الحفظ…");
      const effectiveStatus = statusOverride ?? status;

      try {
        const scheduledAt = effectiveStatus === "scheduled"
          ? scheduleLocal
            ? zonedDateTimeToUtc(scheduleLocal, timezone)
            : null
          : null;

        if (effectiveStatus === "scheduled" && !scheduledAt) {
          setMessage("حدد موعد النشر.");
          return false;
        }

        const result = await savePostAction({
          id: postId,
          title,
          slug: slug || undefined,
          excerpt,
          type,
          status: effectiveStatus,
          contentJson: editor.getJSON(),
          coverImageId: coverImageId || null,
          externalUrl: externalUrl || null,
          featured,
          categoryIds,
          primaryCategoryId: primaryCategoryId || null,
          tagIds,
          scheduledAt,
          revisionSource: source,
          summary: summary || null,
          keyPoints: keyPoints.split("\n").map((item) => item.trim()).filter(Boolean),
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          canonicalUrl: canonicalUrl || null,
          robotsIndex,
          robotsFollow,
          ogTitle: ogTitle || null,
          ogDescription: ogDescription || null,
          ogImageId: ogImageId || null,
          twitterTitle: twitterTitle || null,
          twitterDescription: twitterDescription || null,
          twitterImageId: twitterImageId || null,
          focusKeyword: focusKeyword || null,
          medicalReviewed,
          references,
          faqs,
        });

        if (!result.ok) {
          setMessage(result.error);
          return false;
        }

        setPostId(result.id);
        setSlug(result.slug);
        setStatus(effectiveStatus);
        setDirty(false);
        setMessage(
          result.warning ??
            `تم الحفظ ${new Intl.DateTimeFormat("ar", { timeStyle: "short" }).format(new Date(result.savedAt))}`,
        );

        if (!initial?.id && window.location.pathname.endsWith("/new")) {
          router.replace(`/admin/content/${result.id}/edit`);
        }
        router.refresh();
        return true;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "تعذر حفظ المحتوى.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      editor,
      saving,
      title,
      status,
      scheduleLocal,
      timezone,
      postId,
      slug,
      excerpt,
      type,
      coverImageId,
      externalUrl,
      featured,
      categoryIds,
      primaryCategoryId,
      tagIds,
      summary,
      keyPoints,
      seoTitle,
      seoDescription,
      canonicalUrl,
      robotsIndex,
      robotsFollow,
      ogTitle,
      ogDescription,
      ogImageId,
      twitterTitle,
      twitterDescription,
      twitterImageId,
      focusKeyword,
      medicalReviewed,
      references,
      faqs,
      initial,
      router,
    ],
  );

  useEffect(() => {
    if (!dirty || !title.trim() || saving) return;
    const timer = window.setTimeout(() => void persist("autosave"), 3000);
    return () => window.clearTimeout(timer);
  }, [dirty, title, saving, documentJson, excerpt, slug, persist]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const selectedCategories = categories.filter((item) => categoryIds.includes(item.id));
  const isMedical = selectedCategories.some((item) => ["medical", "pharmacy"].includes(item.slug));
  const cover = media.find((item) => item.id === coverImageId);
  const contentText = editor?.getText({ blockSeparator: "\n" }) ?? "";
  const quality = buildQualityChecklist({
    title,
    excerpt,
    contentText,
    categoryCount: categoryIds.length,
    coverId: coverImageId || null,
    coverAlt: cover?.altText,
    seoDescription,
    references,
    contentHtml: editor?.getHTML() ?? "",
  });
  const headingIssues = headingWarnings(editor?.getJSON() ?? emptyDoc);
  const imageMedia = media.filter((item) => item.mimeType.startsWith("image/"));
  const previewSlug = slug || slugify(title) || "slug";

  const toggleCategory = (id: string) => {
    setCategoryIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      if (!next.includes(primaryCategoryId)) setPrimaryCategoryId("");
      return next;
    });
    setDirty(true);
  };

  const toggleTag = (id: string) => {
    setTagIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setDirty(true);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5">
          <input
            value={title}
            onChange={(event) => {
              const next = event.target.value;
              setTitle(next);
              if (!initial?.slug && !slug) setSlug(slugify(next));
              setDirty(true);
            }}
            className="w-full bg-transparent text-3xl font-black outline-none"
            placeholder="عنوان المحتوى"
            aria-label="عنوان المحتوى"
          />
          <textarea
            value={excerpt}
            onChange={(event) => { setExcerpt(event.target.value); setDirty(true); }}
            className="admin-input mt-4 min-h-24"
            placeholder="وصف مختصر — يمكن تركه ليُولد من النص"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <EditorToolbar editor={editor} media={imageMedia} />
          <div className="p-6"><EditorContent editor={editor} /></div>
        </section>

        <Panel title="الخلاصة وGEO">
          <textarea
            value={summary}
            onChange={(event) => { setSummary(event.target.value); setDirty(true); }}
            className="admin-input min-h-24"
            placeholder="خلاصة اختيارية تظهر أعلى المقال"
          />
          <label className="grid gap-2 text-xs font-bold">
            أهم النقاط — نقطة في كل سطر
            <textarea
              value={keyPoints}
              onChange={(event) => { setKeyPoints(event.target.value); setDirty(true); }}
              className="admin-input min-h-28"
            />
          </label>
        </Panel>

        <Panel title="المراجع والمصادر">
          <button
            type="button"
            onClick={() => { setReferences((current) => [...current, { title: "", url: null, sortOrder: current.length }]); setDirty(true); }}
            className={buttonSecondary}
          >
            <Plus className="size-4" /> إضافة مرجع
          </button>
          {references.map((reference, index) => (
            <div key={reference.id ?? index} className="grid gap-2 rounded-xl border border-border p-3">
              <div className="flex gap-2">
                <input
                  value={reference.title}
                  onChange={(event) => {
                    setReferences((current) => current.map((item, i) => i === index ? { ...item, title: event.target.value } : item));
                    setDirty(true);
                  }}
                  className="admin-input flex-1"
                  placeholder="عنوان المرجع"
                />
                <button
                  type="button"
                  onClick={() => { setReferences((current) => current.filter((_, i) => i !== index)); setDirty(true); }}
                  className="grid size-10 place-items-center rounded-xl border border-border"
                  aria-label="حذف المرجع"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <input
                value={reference.url ?? ""}
                onChange={(event) => {
                  setReferences((current) => current.map((item, i) => i === index ? { ...item, url: event.target.value } : item));
                  setDirty(true);
                }}
                className="admin-input"
                placeholder="https://…"
                dir="ltr"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={reference.author ?? ""} onChange={(event) => { setReferences((current) => current.map((item, i) => i === index ? { ...item, author: event.target.value } : item)); setDirty(true); }} className="admin-input" placeholder="المؤلف" />
                <input value={reference.publisher ?? ""} onChange={(event) => { setReferences((current) => current.map((item, i) => i === index ? { ...item, publisher: event.target.value } : item)); setDirty(true); }} className="admin-input" placeholder="الناشر" />
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="الأسئلة الشائعة">
          <button
            type="button"
            onClick={() => { setFaqs((current) => [...current, { question: "", answer: "", sortOrder: current.length }]); setDirty(true); }}
            className={buttonSecondary}
          >
            <Plus className="size-4" /> إضافة سؤال
          </button>
          {faqs.map((faq, index) => (
            <div key={faq.id ?? index} className="grid gap-2 rounded-xl border border-border p-3">
              <div className="flex gap-2">
                <input value={faq.question} onChange={(event) => { setFaqs((current) => current.map((item, i) => i === index ? { ...item, question: event.target.value } : item)); setDirty(true); }} className="admin-input flex-1" placeholder="السؤال" />
                <button type="button" onClick={() => { setFaqs((current) => current.filter((_, i) => i !== index)); setDirty(true); }} className="grid size-10 place-items-center rounded-xl border border-border" aria-label="حذف السؤال"><Trash2 className="size-4" /></button>
              </div>
              <textarea value={faq.answer} onChange={(event) => { setFaqs((current) => current.map((item, i) => i === index ? { ...item, answer: event.target.value } : item)); setDirty(true); }} className="admin-input min-h-24" placeholder="الإجابة" />
            </div>
          ))}
        </Panel>
      </div>

      <aside className="space-y-4">
        <Panel title="النشر">
          <div className="flex items-center justify-between text-xs"><span>الحالة</span><strong>{status}</strong></div>
          <button type="button" disabled={saving} onClick={() => void persist("manual")} className={buttonSecondary}><Save className="size-4" /> حفظ</button>
          {postId ? <button type="button" onClick={() => window.open(`/api/preview?id=${encodeURIComponent(postId)}`, "_blank", "noopener,noreferrer")} className={buttonSecondary}><Eye className="size-4" /> معاينة</button> : null}
          {canPublish && status !== "published" ? <button type="button" onClick={() => setPublishOpen(true)} className={buttonPrimary}><Send className="size-4" /> نشر الآن</button> : null}
          {canPublish && status === "published" ? <button type="button" onClick={() => void persist("publish", "published")} className={buttonPrimary}><Send className="size-4" /> تحديث المنشور</button> : null}
          {canPublish && status === "published" ? <button type="button" onClick={() => void persist("manual", "draft")} className={buttonSecondary}>إلغاء النشر</button> : null}
          <div className="rounded-xl border border-border p-3">
            <label className="grid gap-2 text-xs font-bold">
              موعد النشر — {timezone}
              <input type="datetime-local" value={scheduleLocal} onChange={(event) => setScheduleLocal(event.target.value)} className="admin-input" />
            </label>
            {canPublish ? <button type="button" disabled={!scheduleLocal} onClick={() => void persist("manual", "scheduled")} className={`${buttonSecondary} mt-2 w-full`}><CalendarClock className="size-4" /> جدولة</button> : null}
          </div>
          <p className="min-h-5 text-xs leading-6 text-muted-foreground" role="status">{saving ? "جارٍ الحفظ…" : message}</p>
        </Panel>

        <Panel title="بيانات المحتوى">
          <Field label="Slug"><input value={slug} onChange={(event) => { setSlug(slugify(event.target.value)); setDirty(true); }} className="admin-input" dir="ltr" /></Field>
          <Field label="النوع"><select value={type} onChange={(event) => { setType(event.target.value as ContentType); setDirty(true); }} className="admin-input"><option value="article">مقال</option><option value="note">تدوينة</option><option value="diary">يومية</option><option value="story">قصة</option><option value="link">رابط</option><option value="page">صفحة</option></select></Field>
          {type === "link" ? <Field label="الرابط الخارجي"><input value={externalUrl} onChange={(event) => { setExternalUrl(event.target.value); setDirty(true); }} className="admin-input" dir="ltr" /></Field> : null}
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={featured} onChange={(event) => { setFeatured(event.target.checked); setDirty(true); }} /> محتوى مميز</label>
        </Panel>

        <Panel title="الأقسام والوسوم">
          <div className="flex flex-wrap gap-2">{categories.map((category) => <label key={category.id} className="rounded-full border border-border px-2 py-1 text-xs"><input type="checkbox" className="ml-1" checked={categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />{category.name}</label>)}</div>
          {categoryIds.length ? <Field label="القسم الرئيسي"><select value={primaryCategoryId} onChange={(event) => { setPrimaryCategoryId(event.target.value); setDirty(true); }} className="admin-input"><option value="">تلقائي</option>{selectedCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field> : null}
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">{tags.map((tag) => <label key={tag.id} className="rounded-full border border-border px-2 py-1 text-xs"><input type="checkbox" className="ml-1" checked={tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} />{tag.name}</label>)}</div>
          {isMedical ? <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">للمحتوى الطبي والصيدلاني: أضف المصادر المناسبة ولا تفعّل المراجعة الطبية إلا إذا تمت فعليًا.</p> : null}
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={medicalReviewed} onChange={(event) => { setMedicalReviewed(event.target.checked); setDirty(true); }} /> تمت مراجعة طبية فعلية وموثقة</label>
        </Panel>

        <Panel title="الصور">
          <Field label="الغلاف"><select value={coverImageId} onChange={(event) => { setCoverImageId(event.target.value); setDirty(true); }} className="admin-input"><option value="">بدون صورة</option>{imageMedia.map((item) => <option key={item.id} value={item.id}>{item.fileName}{item.altText ? "" : " — بلا Alt"}</option>)}</select></Field>
          {coverImageId && !cover?.altText ? <p className="text-xs text-amber-700">تحذير: صورة الغلاف بلا Alt.</p> : null}
        </Panel>

        <Panel title="SEO وOpen Graph">
          <Field label={`SEO Title (${seoTitle.length})`}><input value={seoTitle} onChange={(event) => { setSeoTitle(event.target.value); setDirty(true); }} className="admin-input" placeholder={title} /></Field>
          <Field label={`Meta Description (${seoDescription.length})`}><textarea value={seoDescription} onChange={(event) => { setSeoDescription(event.target.value); setDirty(true); }} className="admin-input min-h-20" placeholder={excerpt} /></Field>
          <Field label="Canonical"><input value={canonicalUrl} onChange={(event) => { setCanonicalUrl(event.target.value); setDirty(true); }} className="admin-input" dir="ltr" placeholder={`/posts/${previewSlug}`} /></Field>
          <div className="flex gap-4 text-xs"><label><input type="checkbox" checked={robotsIndex} onChange={(event) => { setRobotsIndex(event.target.checked); setDirty(true); }} /> Index</label><label><input type="checkbox" checked={robotsFollow} onChange={(event) => { setRobotsFollow(event.target.checked); setDirty(true); }} /> Follow</label></div>
          <Field label="Focus keyword"><input value={focusKeyword} onChange={(event) => { setFocusKeyword(event.target.value); setDirty(true); }} className="admin-input" /></Field>
          <div className="rounded-xl border border-border bg-background p-3"><p className="text-sm font-bold text-blue-700">{seoTitle || title || "عنوان الصفحة"}</p><p className="mt-1 truncate text-xs text-emerald-700">{canonicalUrl || `/posts/${previewSlug}`}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{seoDescription || excerpt || "وصف الصفحة"}</p></div>
          <Field label="OG Title"><input value={ogTitle} onChange={(event) => { setOgTitle(event.target.value); setDirty(true); }} className="admin-input" /></Field>
          <Field label="OG Description"><textarea value={ogDescription} onChange={(event) => { setOgDescription(event.target.value); setDirty(true); }} className="admin-input min-h-20" /></Field>
          <Field label="OG Image"><select value={ogImageId} onChange={(event) => { setOgImageId(event.target.value); setDirty(true); }} className="admin-input"><option value="">تلقائية</option>{imageMedia.map((item) => <option key={item.id} value={item.id}>{item.fileName}</option>)}</select></Field>
          <Field label="X Title"><input value={twitterTitle} onChange={(event) => { setTwitterTitle(event.target.value); setDirty(true); }} className="admin-input" /></Field>
          <Field label="X Description"><textarea value={twitterDescription} onChange={(event) => { setTwitterDescription(event.target.value); setDirty(true); }} className="admin-input min-h-20" /></Field>
          <Field label="X Image"><select value={twitterImageId} onChange={(event) => { setTwitterImageId(event.target.value); setDirty(true); }} className="admin-input"><option value="">استخدم OG</option>{imageMedia.map((item) => <option key={item.id} value={item.id}>{item.fileName}</option>)}</select></Field>
        </Panel>

        <Panel title="جودة المحتوى">
          <p className="text-xs text-muted-foreground">{countWords(contentText)} كلمة · {readingMinutes(contentText)} دقيقة تقريبًا</p>
          <ul className="grid gap-1.5 text-xs">{quality.map((item) => <li key={item.label} className={item.ok ? "text-emerald-700" : "text-amber-700"}>{item.ok ? "✓" : "!"} {item.label}</li>)}</ul>
          {headingIssues.map((warning) => <p key={warning} className="text-xs text-amber-700">! {warning}</p>)}
        </Panel>
      </aside>

      <Dialog.Root open={publishOpen} onOpenChange={setPublishOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content dir="rtl" className="fixed left-1/2 top-1/2 z-50 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between"><Dialog.Title className="text-lg font-black">تأكيد النشر</Dialog.Title><Dialog.Close className="grid size-9 place-items-center rounded-xl border border-border"><X className="size-4" /></Dialog.Close></div>
            <ul className="mt-4 grid gap-2 text-sm">{quality.slice(0, 7).map((item) => <li key={item.label}>{item.ok ? "✓" : "!"} {item.label}</li>)}</ul>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">التحذيرات إرشادية. أخطاء البيانات الفعلية فقط تمنع النشر.</p>
            <div className="mt-5 flex gap-2"><button type="button" disabled={saving} onClick={async () => { if (await persist("publish", "published")) setPublishOpen(false); }} className={buttonPrimary}>نشر الآن</button><Dialog.Close className={buttonSecondary}>إلغاء</Dialog.Close></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function EditorToolbar({ editor, media }: { editor: Editor | null; media: MediaItem[] }) {
  if (!editor) return <div className="h-14 border-b border-border bg-muted/20" />;
  const tool = "grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground";

  const addLink = () => {
    const href = window.prompt("أدخل الرابط (https:// أو mailto:)", "https://");
    if (!href || !/^(https?:\/\/|mailto:)/i.test(href)) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const addImage = () => {
    if (!media.length) return;
    const choices = media.slice(0, 20).map((item, index) => `${index + 1}. ${item.fileName}`).join("\n");
    const selected = Number(window.prompt(`اختر رقم الصورة:\n${choices}`, "1"));
    const item = media[selected - 1];
    if (!item) return;
    editor.chain().focus().setImage({ src: item.url, alt: item.altText || item.fileName }).run();
  };

  return (
    <div className="sticky top-16 z-10 flex flex-wrap gap-1 border-b border-border bg-card/95 p-2 backdrop-blur">
      <Tool className={tool} label="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Tool>
      <Tool className={tool} label="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Tool>
      <Tool className={tool} label="H4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}><span className="text-xs font-black">H4</span></Tool>
      <Tool className={tool} label="عريض" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Tool>
      <Tool className={tool} label="مائل" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Tool>
      <Tool className={tool} label="قائمة" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></Tool>
      <Tool className={tool} label="قائمة مرقمة" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Tool>
      <Tool className={tool} label="اقتباس" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Tool>
      <Tool className={tool} label="كود" onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="size-4" /></Tool>
      <Tool className={tool} label="رابط" onClick={addLink}><Link2 className="size-4" /></Tool>
      <Tool className={tool} label="صورة" onClick={addImage}><ImageIcon className="size-4" /></Tool>
      <Tool className={tool} label="جدول" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="size-4" /></Tool>
    </div>
  );
}

function Tool({ className, label, onClick, children }: { className: string; label: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={className} title={label} aria-label={label} onClick={onClick}>{children}</button>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="grid gap-3 rounded-2xl border border-border bg-card p-4"><h2 className="text-sm font-black">{title}</h2>{children}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-xs font-bold text-muted-foreground"><span>{label}</span>{children}</label>;
}
