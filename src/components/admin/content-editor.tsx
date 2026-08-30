"use client";

import type { JSONContent } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold, Braces, Code2, Heading1, Heading2, Heading3, Highlighter, ImageIcon,
  Italic, Link2, List, ListChecks, ListOrdered, Minus, Pilcrow, Quote, Save,
  Strikethrough, Table2, Underline, AlertTriangle, Info, FileText,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { contentExtensions } from "@/lib/content/extensions";
import { savePostAction, type SavePostPayload } from "@/app/admin/(cms)/content/actions";

type Option = { id: string; name: string; slug?: string };
type MediaOption = { id: string; label: string; url: string; alt: string };

type InitialPost = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  type?: SavePostPayload["type"];
  status?: SavePostPayload["status"];
  contentJson?: JSONContent;
  coverImageId?: string | null;
  externalUrl?: string | null;
  featured?: boolean;
  categoryIds?: string[];
  primaryCategoryId?: string | null;
  tagIds?: string[];
  scheduledAt?: string | null;
};

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function ContentEditor({
  initial = {},
  categories,
  tags,
  media,
  canPublish,
}: {
  initial?: InitialPost;
  categories: Option[];
  tags: Option[];
  media: MediaOption[];
  canPublish: boolean;
}) {
  const [postId, setPostId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
  const [type, setType] = useState<SavePostPayload["type"]>(initial.type ?? "article");
  const [status, setStatus] = useState<SavePostPayload["status"]>(initial.status ?? "draft");
  const [coverImageId, setCoverImageId] = useState(initial.coverImageId ?? "");
  const [externalUrl, setExternalUrl] = useState(initial.externalUrl ?? "");
  const [featured, setFeatured] = useState(initial.featured ?? false);
  const [categoryIds, setCategoryIds] = useState<string[]>(initial.categoryIds ?? []);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(initial.primaryCategoryId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds ?? []);
  const [scheduledAt, setScheduledAt] = useState(initial.scheduledAt?.slice(0, 16) ?? "");
  const [documentJson, setDocumentJson] = useState<JSONContent>(initial.contentJson ?? emptyDoc);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const saveSequence = useRef(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...contentExtensions,
      Placeholder.configure({ placeholder: "ابدأ الكتابة… واكتب / لإدراج كتلة." }),
    ],
    content: initial.contentJson ?? emptyDoc,
    editorProps: {
      attributes: {
        class: "cms-editor-content min-h-[48vh] outline-none",
        spellcheck: "true",
        dir: "rtl",
        "aria-label": "محرر المحتوى",
      },
    },
    onUpdate({ editor: currentEditor }) {
      const json = currentEditor.getJSON();
      setDocumentJson(json);
      setDirty(true);
      setSaveState("idle");
      const text = currentEditor.state.selection.$from.parent.textContent;
      setSlashOpen(text.trimEnd().endsWith("/"));
    },
  });

  const buildPayload = useCallback((revisionSource: SavePostPayload["revisionSource"]): SavePostPayload => ({
    id: postId,
    title,
    slug: slug || undefined,
    excerpt,
    type,
    status,
    contentJson: documentJson,
    coverImageId: coverImageId || null,
    externalUrl: externalUrl || null,
    featured,
    categoryIds,
    primaryCategoryId: primaryCategoryId || null,
    tagIds,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    revisionSource,
  }), [postId, title, slug, excerpt, type, status, documentJson, coverImageId, externalUrl, featured, categoryIds, primaryCategoryId, tagIds, scheduledAt]);

  const persist = useCallback(async (source: SavePostPayload["revisionSource"] = "manual") => {
    if (!title.trim()) {
      if (source !== "autosave") {
        setSaveState("error");
        setSaveMessage("أدخل عنوانًا قبل الحفظ.");
      }
      return null;
    }

    const sequence = ++saveSequence.current;
    setSaveState("saving");
    setSaveMessage(source === "autosave" ? "حفظ تلقائي…" : "جارٍ الحفظ…");
    const result = await savePostAction(buildPayload(source));
    if (sequence !== saveSequence.current) return result;

    if (!result.ok) {
      setSaveState("error");
      setSaveMessage(result.error);
      return result;
    }

    setPostId(result.id);
    setSlug(result.slug);
    setDirty(false);
    setSaveState("saved");
    setSaveMessage(`تم الحفظ ${new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(new Date(result.savedAt))}`);

    if (!initial.id && window.location.pathname.endsWith("/new")) {
      window.history.replaceState({}, "", `/admin/content/${result.id}/edit`);
    }
    return result;
  }, [buildPayload, initial.id, title]);

  useEffect(() => {
    if (!dirty || !title.trim()) return;
    const timer = window.setTimeout(() => void persist("autosave"), 1800);
    return () => window.clearTimeout(timer);
  }, [dirty, title, documentJson, excerpt, slug, type, status, coverImageId, externalUrl, featured, categoryIds, primaryCategoryId, tagIds, scheduledAt, persist]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const previewHref = postId ? `/admin/preview/${postId}` : null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 sm:p-5">
          <input
            value={title}
            onChange={(event) => { setTitle(event.target.value); setDirty(true); }}
            placeholder="عنوان المحتوى"
            className="w-full bg-transparent text-2xl font-black tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-3xl"
            aria-label="عنوان المحتوى"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="flex min-w-0 items-center rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground">
              <span className="shrink-0">الرابط:</span>
              <input value={slug} onChange={(event) => { setSlug(event.target.value); setDirty(true); }} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-foreground outline-none" dir="ltr" placeholder="يُولد تلقائيًا" />
            </label>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className={saveState === "error" ? "text-destructive" : "text-muted-foreground"} role="status">{saveMessage || (dirty ? "تغييرات غير محفوظة" : "جاهز")}</span>
              <button type="button" onClick={() => void persist("manual")} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-primary-foreground disabled:opacity-50" disabled={saveState === "saving"}>
                <Save className="size-4" aria-hidden="true" /> حفظ
              </button>
              {previewHref ? <a href={previewHref} target="_blank" className="inline-flex h-9 items-center rounded-xl border border-border px-3 hover:bg-accent">معاينة</a> : null}
            </div>
          </div>
        </div>

        <EditorToolbar editor={editor} />
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <EditorContent editor={editor} />
          {slashOpen && editor ? <SlashMenu editor={editor} close={() => setSlashOpen(false)} /> : null}
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <Panel title="النشر">
          <Field label="النوع">
            <select value={type} onChange={(event) => { setType(event.target.value as SavePostPayload["type"]); setDirty(true); }} className="admin-input">
              <option value="article">مقال</option><option value="note">تدوينة</option><option value="diary">يومية</option><option value="story">قصة</option><option value="link">رابط</option><option value="page">صفحة</option>
            </select>
          </Field>
          <Field label="الحالة">
            <select value={status} onChange={(event) => { setStatus(event.target.value as SavePostPayload["status"]); setDirty(true); }} className="admin-input">
              <option value="draft">مسودة</option><option value="review">للمراجعة</option>
              {canPublish ? <><option value="published">منشور</option><option value="scheduled">مجدول</option></> : null}
              <option value="archived">مؤرشف</option>
            </select>
          </Field>
          {status === "scheduled" ? <Field label="موعد النشر"><input type="datetime-local" value={scheduledAt} onChange={(event) => { setScheduledAt(event.target.value); setDirty(true); }} className="admin-input" /></Field> : null}
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={featured} onChange={(event) => { setFeatured(event.target.checked); setDirty(true); }} /> محتوى مميز</label>
          {type === "link" ? <Field label="الرابط الخارجي"><input type="url" dir="ltr" value={externalUrl} onChange={(event) => { setExternalUrl(event.target.value); setDirty(true); }} className="admin-input" /></Field> : null}
          {canPublish ? <button type="button" onClick={() => { setStatus("published"); setDirty(true); window.setTimeout(() => void persist("publish"), 0); }} className="h-10 rounded-xl bg-primary text-sm font-black text-primary-foreground">نشر الآن</button> : null}
        </Panel>

        <Panel title="الملخص">
          <textarea value={excerpt} onChange={(event) => { setExcerpt(event.target.value); setDirty(true); }} rows={5} maxLength={1000} className="admin-input min-h-28 resize-y py-3" placeholder="ملخص قصير يظهر في بطاقات المقال." />
        </Panel>

        <Panel title="صورة الغلاف">
          <select value={coverImageId} onChange={(event) => { setCoverImageId(event.target.value); setDirty(true); }} className="admin-input">
            <option value="">بدون صورة</option>
            {media.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          {coverImageId ? (() => { const selected = media.find((item) => item.id === coverImageId); return selected ? <img src={selected.url} alt={selected.alt} className="aspect-video w-full rounded-xl object-cover" /> : null; })() : null}
          <a href="/admin/media" target="_blank" className="text-xs font-bold text-primary">فتح مكتبة الوسائط</a>
        </Panel>

        <Panel title="الأقسام">
          <div className="grid max-h-52 gap-2 overflow-y-auto">
            {categories.map((category) => <label key={category.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={(event) => { setCategoryIds((current) => event.target.checked ? [...new Set([...current, category.id])] : current.filter((id) => id !== category.id)); if (!event.target.checked && primaryCategoryId === category.id) setPrimaryCategoryId(""); setDirty(true); }} />{category.name}</label>)}
          </div>
          <Field label="القسم الرئيسي"><select value={primaryCategoryId} onChange={(event) => { setPrimaryCategoryId(event.target.value); setDirty(true); }} className="admin-input"><option value="">تلقائي</option>{categories.filter((category) => categoryIds.includes(category.id)).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
        </Panel>

        <Panel title="الوسوم">
          <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto">
            {tags.map((tag) => <label key={tag.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold ${tagIds.includes(tag.id) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}><input type="checkbox" className="sr-only" checked={tagIds.includes(tag.id)} onChange={(event) => { setTagIds((current) => event.target.checked ? [...new Set([...current, tag.id])] : current.filter((id) => id !== tag.id)); setDirty(true); }} />{tag.name}</label>)}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const rerender = () => forceUpdate((value) => value + 1);
    editor.on("selectionUpdate", rerender);
    editor.on("transaction", rerender);
    return () => { editor.off("selectionUpdate", rerender); editor.off("transaction", rerender); };
  }, [editor]);

  if (!editor) return <div className="h-14 border-b border-border bg-muted/20" />;

  const promptLink = () => {
    const href = window.prompt("أدخل الرابط (https:// أو mailto:)", editor.getAttributes("link").href ?? "https://");
    if (!href) return;
    if (!/^(https?:\/\/|mailto:)/i.test(href)) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };
  const promptImage = () => {
    const src = window.prompt("رابط الصورة من مكتبة الوسائط", "https://");
    if (!src || !/^https:\/\//i.test(src)) return;
    editor.chain().focus().setImage({ src, alt: "" }).run();
  };

  const tools = [
    [Pilcrow, "فقرة", () => editor.chain().focus().setParagraph().run(), editor.isActive("paragraph")],
    [Heading1, "عنوان 1", () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 })],
    [Heading2, "عنوان 2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 })],
    [Heading3, "عنوان 3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 })],
    [Bold, "عريض", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold")],
    [Italic, "مائل", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic")],
    [Underline, "تحته خط", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline")],
    [Strikethrough, "مشطوب", () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike")],
    [Highlighter, "تمييز", () => editor.chain().focus().toggleHighlight().run(), editor.isActive("highlight")],
    [List, "قائمة", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList")],
    [ListOrdered, "قائمة مرقمة", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList")],
    [ListChecks, "قائمة مهام", () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList")],
    [Quote, "اقتباس", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote")],
    [Code2, "كود", () => editor.chain().focus().toggleCode().run(), editor.isActive("code")],
    [Braces, "كتلة كود", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock")],
  ] as const;

  return (
    <div className="sticky top-16 z-10 flex flex-wrap gap-1 border-b border-border bg-card/95 p-2 backdrop-blur">
      {tools.map(([Icon, label, action, active]) => <ToolbarButton key={label} label={label} active={active} onClick={action}><Icon className="size-4" /></ToolbarButton>)}
      <ToolbarButton label="رابط" active={editor.isActive("link")} onClick={promptLink}><Link2 className="size-4" /></ToolbarButton>
      <ToolbarButton label="صورة" onClick={promptImage}><ImageIcon className="size-4" /></ToolbarButton>
      <ToolbarButton label="جدول" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="size-4" /></ToolbarButton>
      <ToolbarButton label="فاصل" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolbarButton>
      <ToolbarButton label="مربع معلومات" onClick={() => editor.chain().focus().insertContent({ type: "callout", attrs: { kind: "info" }, content: [{ type: "paragraph" }] }).run()}><Info className="size-4" /></ToolbarButton>
      <ToolbarButton label="تنبيه" onClick={() => editor.chain().focus().insertContent({ type: "callout", attrs: { kind: "warning" }, content: [{ type: "paragraph" }] }).run()}><AlertTriangle className="size-4" /></ToolbarButton>
    </div>
  );
}

function SlashMenu({ editor, close }: { editor: NonNullable<ReturnType<typeof useEditor>>; close: () => void }) {
  const commands = useMemo(() => [
    ["عنوان", Heading2, () => editor.chain().focus().deleteRange({ from: Math.max(1, editor.state.selection.from - 1), to: editor.state.selection.from }).toggleHeading({ level: 2 }).run()],
    ["صورة", ImageIcon, () => { const src = window.prompt("رابط الصورة", "https://"); if (src && /^https:\/\//i.test(src)) editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).setImage({ src }).run(); }],
    ["اقتباس", Quote, () => editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleBlockquote().run()],
    ["جدول", Table2, () => editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
    ["مربع معلومات", Info, () => editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent({ type: "callout", attrs: { kind: "info" }, content: [{ type: "paragraph" }] }).run()],
    ["تنبيه طبي", AlertTriangle, () => editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent({ type: "callout", attrs: { kind: "medical" }, content: [{ type: "paragraph" }] }).run()],
    ["كود", Braces, () => editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleCodeBlock().run()],
    ["مرجع", FileText, () => editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent({ type: "callout", attrs: { kind: "reference" }, content: [{ type: "paragraph" }] }).run()],
  ] as const, [editor]);

  return <div className="absolute right-8 top-8 z-20 w-56 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-xl">{commands.map(([label, Icon, command]) => <button key={label} type="button" onClick={() => { command(); close(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-sm font-bold hover:bg-accent"><Icon className="size-4 text-primary" />{label}</button>)}</div>;
}

function ToolbarButton({ label, active = false, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick} className={`grid size-9 place-items-center rounded-lg transition ${active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{children}</button>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-4"><h2 className="text-sm font-black">{title}</h2>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-xs font-bold text-muted-foreground"><span>{label}</span>{children}</label>; }
