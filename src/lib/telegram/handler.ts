import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDraft, publishPost, schedulePost, archivePost, resolveOwnerProfileId } from "@/lib/domain/publishing";
import { zonedDateTimeToUtc } from "@/lib/datetime/timezone";
import { authorizeTelegramUser, telegramRoleCan } from "@/lib/telegram/auth";
import { telegramClient } from "@/lib/telegram/client";
import { keyboards } from "@/lib/telegram/keyboards";
import { escapeHtml, notifyOwners, postPublishedToChannel, publicationMessage } from "@/lib/telegram/notifications";
import type { TelegramCallbackQuery, TelegramMessage, TelegramRole, TelegramUpdate } from "@/lib/telegram/types";

const sessionTtlMs = 30 * 60 * 1000;
const allowedImageMime = new Set(["image/jpeg", "image/png", "image/webp"]);

type Session = { telegram_user_id: number; state: string; context: Record<string, unknown>; expires_at: string };

function commandFrom(text?: string) {
  if (!text?.startsWith("/")) return null;
  const [head, ...rest] = text.trim().split(/\s+/u);
  return { command: head.slice(1).split("@")[0].toLowerCase(), argument: rest.join(" ").trim() };
}

function chatAndUser(update: TelegramUpdate) {
  if (update.callback_query) return { chatId: update.callback_query.message?.chat.id, userId: update.callback_query.from.id };
  return { chatId: update.message?.chat.id, userId: update.message?.from?.id };
}

async function beginAction(update: TelegramUpdate, userId: number) {
  const supabase = createAdminClient();
  const command = update.message?.text?.startsWith("/") ? commandFrom(update.message.text)?.command ?? null : update.callback_query?.data?.split(":", 1)[0] ?? null;
  const payload = { message_id: update.message?.message_id ?? update.callback_query?.message?.message_id ?? null, has_photo: Boolean(update.message?.photo?.length), has_callback: Boolean(update.callback_query) };
  const { data, error } = await supabase.from("telegram_actions").insert({ telegram_user_id: userId, update_id: update.update_id, command, action: command ?? "message", request_payload: payload }).select("id").single();
  if (error?.code === "23505") return null;
  if (error) throw new Error(`TELEGRAM_ACTION_LOG_FAILED: ${error.message}`);
  return data.id as string;
}

async function finishAction(actionId: string | null, status: "succeeded" | "failed" | "ignored", result: Record<string, unknown> = {}, errorMessage?: string) {
  if (!actionId) return;
  const supabase = createAdminClient();
  await supabase.from("telegram_actions").update({ status, result_payload: result, error_message: errorMessage?.slice(0, 1000) ?? null }).eq("id", actionId);
}

async function loadSession(userId: number): Promise<Session | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("telegram_sessions").select("telegram_user_id,state,context,expires_at").eq("telegram_user_id", userId).gt("expires_at", new Date().toISOString()).maybeSingle();
  return data ? { ...data, telegram_user_id: Number(data.telegram_user_id), context: (data.context ?? {}) as Record<string, unknown> } : null;
}

async function saveSession(userId: number, state: string, context: Record<string, unknown>) {
  const supabase = createAdminClient();
  await supabase.from("telegram_sessions").upsert({ telegram_user_id: userId, state, context, expires_at: new Date(Date.now() + sessionTtlMs).toISOString(), updated_at: new Date().toISOString() });
}

async function clearSession(userId: number) {
  const supabase = createAdminClient();
  await supabase.from("telegram_sessions").delete().eq("telegram_user_id", userId);
}

async function siteTimezone() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("site_settings").select("timezone").eq("id", true).maybeSingle();
  return data?.timezone || "Asia/Aden";
}

function parseScheduleText(value: string, timeZone: string) {
  const normalized = value.trim().replace("غدا", "غدًا");
  const now = new Date();
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const today = new Date(`${localDate}T00:00:00Z`);
  let datePart = "";
  let timePart = "";
  const relative = normalized.match(/^(اليوم|غدًا)\s+(\d{1,2}:\d{2})$/u);
  if (relative) {
    const day = new Date(today);
    if (relative[1] === "غدًا") day.setUTCDate(day.getUTCDate() + 1);
    datePart = day.toISOString().slice(0, 10);
    timePart = relative[2];
  } else {
    const explicit = normalized.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})$/u);
    if (!explicit) return null;
    datePart = explicit[1];
    timePart = explicit[2];
  }
  const [hours, minutes] = timePart.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) return null;
  try { return zonedDateTimeToUtc(`${datePart}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`, timeZone); } catch { return null; }
}

async function listPosts(chatId: number, status: "draft" | "published" | "scheduled") {
  const supabase = createAdminClient();
  let query = supabase.from("posts").select("id,title,slug,status,published_at,scheduled_at").eq("status", status).is("deleted_at", null).order(status === "scheduled" ? "scheduled_at" : status === "published" ? "published_at" : "updated_at", { ascending: false }).limit(8);
  if (status === "published") query = query.lte("published_at", new Date().toISOString());
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data?.length) return telegramClient.sendMessage(chatId, status === "draft" ? "لا توجد مسودات." : status === "scheduled" ? "لا توجد مواد مجدولة." : "لا توجد منشورات بعد.");
  for (const post of data) {
    if (status === "draft") await telegramClient.sendMessage(chatId, `📄 <b>${escapeHtml(post.title)}</b>`, keyboards.draft(post.id));
    else if (status === "scheduled") await telegramClient.sendMessage(chatId, `⏰ <b>${escapeHtml(post.title)}</b>\n${escapeHtml(post.scheduled_at ?? "")}`, keyboards.queue(post.id));
    else {
      const url = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/u, "")}/posts/${encodeURIComponent(post.slug)}`;
      await telegramClient.sendMessage(chatId, `📰 <b>${escapeHtml(post.title)}</b>\n${escapeHtml(url)}`, { inline_keyboard: [[{ text: "فتح", url }]] });
    }
  }
}

async function searchPosts(chatId: number, query: string) {
  if (!query.trim()) return telegramClient.sendMessage(chatId, "استخدم: /search كلمة البحث");
  const supabase = createAdminClient();
  const escaped = query.replace(/[%_]/gu, "\\$&");
  const { data, error } = await supabase.from("posts").select("id,title,slug,status").is("deleted_at", null).ilike("title", `%${escaped}%`).order("updated_at", { ascending: false }).limit(6);
  if (error) throw new Error(error.message);
  if (!data?.length) return telegramClient.sendMessage(chatId, "لا توجد نتائج.");
  return telegramClient.sendMessage(chatId, data.map((post) => `• ${escapeHtml(post.title)} — ${post.status}`).join("\n"));
}

async function stats(chatId: number) {
  const supabase = createAdminClient();
  const [published, drafts, scheduled, subscribers] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return telegramClient.sendMessage(chatId, `📊 <b>ملخص المنصة</b>\nمنشور: ${published.count ?? 0}\nمسودات: ${drafts.count ?? 0}\nمجدول: ${scheduled.count ?? 0}\nمشتركون: ${subscribers.count ?? 0}`);
}

async function savePhoto(userId: number, message: TelegramMessage) {
  const photo = message.photo?.at(-1);
  if (!photo) throw new Error("PHOTO_NOT_FOUND");
  if (photo.file_size && photo.file_size > 8 * 1024 * 1024) throw new Error("PHOTO_TOO_LARGE");
  const info = await telegramClient.getFile(photo.file_id);
  if (!info.file_path) throw new Error("PHOTO_FILE_PATH_MISSING");
  if (info.file_size && info.file_size > 8 * 1024 * 1024) throw new Error("PHOTO_TOO_LARGE");
  const ext = info.file_path.split(".").pop()?.toLowerCase();
  const extMime: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  const mime = ext ? extMime[ext] : undefined;
  if (!mime || !allowedImageMime.has(mime)) throw new Error("PHOTO_TYPE_NOT_ALLOWED");
  const downloaded = await telegramClient.downloadFile(info.file_path, 8 * 1024 * 1024);
  if (downloaded.contentType.startsWith("image/") && !allowedImageMime.has(downloaded.contentType.split(";", 1)[0])) throw new Error("PHOTO_MIME_NOT_ALLOWED");
  const ownerId = await resolveOwnerProfileId();
  const supabase = createAdminClient();
  const path = `${ownerId}/telegram/${Date.now()}-${randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("blog-media").upload(path, downloaded.bytes, { contentType: mime, upsert: false });
  if (uploadError) throw new Error(`PHOTO_UPLOAD_FAILED: ${uploadError.message}`);
  const { data, error } = await supabase.from("media").insert({ owner_id: ownerId, bucket: "blog-media", path, file_name: `telegram-${message.message_id}.${ext}`, mime_type: mime, size: downloaded.bytes.byteLength, width: photo.width, height: photo.height, alt_text: message.caption?.slice(0, 500) ?? "صورة من Telegram" }).select("id").single();
  if (error) throw new Error(`PHOTO_METADATA_FAILED: ${error.message}`);
  return data.id as string;
}

async function handleCommand(chatId: number, userId: number, role: TelegramRole, command: string, argument: string) {
  if (!telegramRoleCan(role, command)) return telegramClient.sendMessage(chatId, "هذا الأمر غير متاح لصلاحيتك.");
  if (command === "start") return telegramClient.sendMessage(chatId, "مرحبًا. هذه قناة تحكم خاصة بمنصة معتز العلقمي.", keyboards.home());
  if (command === "help") return telegramClient.sendMessage(chatId, "/new إنشاء محتوى\n/drafts المسودات\n/latest آخر المنشورات\n/queue المجدولة\n/search كلمة\n/stats الإحصاءات\n/settings حالة التكامل");
  if (command === "new") return telegramClient.sendMessage(chatId, "اختر نوع المحتوى:", keyboards.newTypes());
  if (command === "drafts") return listPosts(chatId, "draft");
  if (command === "latest") return listPosts(chatId, "published");
  if (command === "queue") return listPosts(chatId, "scheduled");
  if (command === "search") return searchPosts(chatId, argument);
  if (command === "stats") return stats(chatId);
  if (command === "settings") return telegramClient.sendMessage(chatId, `⚙️ Telegram: مهيأ\nالقناة: ${process.env.TELEGRAM_CHANNEL_ID ? "Configured" : "Not configured"}\nالبريد: ${process.env.RESEND_API_KEY ? "Configured" : "Not configured"}`);
  return telegramClient.sendMessage(chatId, "أمر غير معروف. استخدم /help.");
}

async function handleSessionMessage(chatId: number, userId: number, message: TelegramMessage, session: Session) {
  const text = message.text?.trim() ?? message.caption?.trim() ?? "";
  if (session.state === "waiting_title") {
    if (!text) return telegramClient.sendMessage(chatId, "أرسل عنوان المحتوى نصيًا.");
    await saveSession(userId, "waiting_content", { ...session.context, title: text.slice(0, 240) });
    return telegramClient.sendMessage(chatId, "أرسل نص المحتوى. سيُحفظ أولًا كمسودة.");
  }
  if (session.state === "waiting_content") {
    if (!text) return telegramClient.sendMessage(chatId, "أرسل محتوى نصيًا.");
    const type = String(session.context.type ?? "article") as "article" | "note" | "diary" | "story" | "link";
    const title = String(session.context.title ?? "مسودة من Telegram");
    const externalUrl = type === "link" ? (text.match(/https?:\/\/[^\s]+/u)?.[0] ?? null) : null;
    const draft = await createDraft({ title, text, type, externalUrl, source: "telegram" });
    await saveSession(userId, "preview", { postId: draft.id });
    return telegramClient.sendMessage(chatId, `✅ حُفظت كمسودة\n<b>${escapeHtml(draft.title)}</b>`, keyboards.preview(draft.id));
  }
  if (session.state === "waiting_schedule") {
    const postId = String(session.context.postId ?? "");
    const timeZone = await siteTimezone();
    const iso = parseScheduleText(text, timeZone);
    if (!postId || !iso || new Date(iso) <= new Date()) return telegramClient.sendMessage(chatId, `صيغة الموعد غير صحيحة. مثال: غدًا 09:30 أو 2026-09-02 14:00 (${escapeHtml(timeZone)})`);
    await schedulePost(postId, iso, { source: "telegram" });
    await clearSession(userId);
    return telegramClient.sendMessage(chatId, `⏰ تمت الجدولة: ${escapeHtml(iso)} (${escapeHtml(timeZone)})`);
  }
  return null;
}

async function handleCallback(chatId: number, userId: number, role: TelegramRole, callback: TelegramCallbackQuery) {
  const data = callback.data ?? "";
  await telegramClient.answerCallbackQuery(callback.id);
  if (data === "cancel") { await clearSession(userId); return telegramClient.sendMessage(chatId, "تم الإلغاء."); }
  if (data.startsWith("new:")) {
    if (!telegramRoleCan(role, "new")) return telegramClient.sendMessage(chatId, "غير مسموح.");
    const type = data.slice(4);
    if (!["article", "note", "diary", "story", "link"].includes(type)) return;
    await saveSession(userId, "waiting_title", { type });
    return telegramClient.sendMessage(chatId, "أرسل العنوان.");
  }
  if (data === "list:drafts") return listPosts(chatId, "draft");
  if (data === "list:queue") return listPosts(chatId, "scheduled");
  if (data === "list:latest") return listPosts(chatId, "published");
  if (data === "stats") return stats(chatId);
  if (data.startsWith("publish:")) {
    if (!telegramRoleCan(role, "publish")) return telegramClient.sendMessage(chatId, "غير مسموح.");
    const post = await publishPost(data.slice(8), { source: "telegram" });
    const supabase = createAdminClient();
    await supabase.from("analytics_events").insert({ event_name: "telegram_publish", entity_type: "post", entity_id: post.id, metadata: {} });
    await clearSession(userId);
    await telegramClient.sendMessage(chatId, publicationMessage(post), { inline_keyboard: [[{ text: "فتح المقال", url: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/u, "")}/posts/${encodeURIComponent(post.slug)}` }]] });
    try { await postPublishedToChannel({ id: post.id, slug: post.slug, title: post.title }); } catch (error) { await notifyOwners(`⚠️ فشل النشر إلى قناة Telegram للمقال: ${escapeHtml(post.title)}\n${escapeHtml(error instanceof Error ? error.message : "unknown")}`); }
    return;
  }
  if (data.startsWith("schedule:") || data.startsWith("reschedule:")) {
    if (!telegramRoleCan(role, "schedule")) return telegramClient.sendMessage(chatId, "غير مسموح.");
    const postId = data.split(":")[1];
    await saveSession(userId, "waiting_schedule", { postId });
    return telegramClient.sendMessage(chatId, `أرسل الموعد بصيغة: غدًا 09:30 أو 2026-09-02 14:00. المنطقة: ${escapeHtml(await siteTimezone())}`);
  }
  if (data.startsWith("archive:")) {
    if (!telegramRoleCan(role, "archive")) return telegramClient.sendMessage(chatId, "غير مسموح.");
    await archivePost(data.slice(8), { source: "telegram" });
    return telegramClient.sendMessage(chatId, "تمت الأرشفة.");
  }
  if (data.startsWith("cancel_schedule:")) {
    const supabase = createAdminClient();
    await supabase.from("posts").update({ status: "draft", scheduled_at: null, last_publish_error: null, publish_attempts: 0 }).eq("id", data.slice(16));
    return telegramClient.sendMessage(chatId, "تم إلغاء الجدولة وإعادة المحتوى إلى مسودة.");
  }
  if (data.startsWith("direct:")) {
    const session = await loadSession(userId);
    const text = String(session?.context.text ?? "");
    if (!text) return telegramClient.sendMessage(chatId, "انتهت العملية. أرسل النص مرة أخرى.");
    const isLink = data === "direct:link";
    const url = isLink ? (text.match(/https?:\/\/[^\s]+/u)?.[0] ?? null) : null;
    const title = isLink && url ? new URL(url).hostname : text.slice(0, 80);
    const draft = await createDraft({ title, text, type: isLink ? "link" : data === "direct:note" ? "note" : "article", externalUrl: url, source: "telegram" });
    await clearSession(userId);
    return telegramClient.sendMessage(chatId, `✅ حُفظت مسودة: <b>${escapeHtml(draft.title)}</b>`, keyboards.draft(draft.id));
  }
  if (data.startsWith("photo:")) {
    const session = await loadSession(userId);
    const message = session?.context.message as TelegramMessage | undefined;
    if (!message?.photo?.length) return telegramClient.sendMessage(chatId, "انتهت صلاحية الصورة. أرسلها مرة أخرى.");
    const mediaId = await savePhoto(userId, message);
    if (data === "photo:library") { await clearSession(userId); return telegramClient.sendMessage(chatId, "✅ أضيفت الصورة إلى مكتبة الوسائط."); }
    const draft = await createDraft({ title: message.caption?.slice(0, 80) || "تدوينة بصورة", text: message.caption ?? "", type: "note", source: "telegram" });
    const supabase = createAdminClient();
    await supabase.from("posts").update({ cover_image_id: mediaId }).eq("id", draft.id);
    await clearSession(userId);
    return telegramClient.sendMessage(chatId, `✅ أُنشئت تدوينة كمسودة مع الصورة.`, keyboards.draft(draft.id));
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const { chatId, userId } = chatAndUser(update);
  if (!chatId || !userId) return { ignored: true, reason: "NO_USER_OR_CHAT" };
  const auth = await authorizeTelegramUser(userId);
  if (!auth.allowed || !auth.role) return { ignored: true, reason: "UNAUTHORIZED_USER" };
  const actionId = await beginAction(update, userId);
  if (!actionId) return { ignored: true, reason: "DUPLICATE_UPDATE" };

  try {
    if (update.callback_query) {
      await handleCallback(chatId, userId, auth.role, update.callback_query);
      await finishAction(actionId, "succeeded", { kind: "callback" });
      return { ok: true };
    }

    const message = update.message;
    if (!message) { await finishAction(actionId, "ignored", { reason: "NO_MESSAGE" }); return { ignored: true }; }
    if ((message as unknown as { voice?: unknown }).voice) {
      await telegramClient.sendMessage(chatId, "الرسائل الصوتية وصلت، لكن التفريغ الصوتي غير مفعّل في هذه المرحلة.");
      await finishAction(actionId, "ignored", { reason: "VOICE_UNSUPPORTED" });
      return { ignored: true };
    }
    if (message.photo?.length) {
      await saveSession(userId, "photo_choice", { message });
      await telegramClient.sendMessage(chatId, "ماذا تريد أن تفعل بالصورة؟", keyboards.photo());
      await finishAction(actionId, "succeeded", { kind: "photo_prompt" });
      return { ok: true };
    }

    const command = commandFrom(message.text);
    if (command) {
      await handleCommand(chatId, userId, auth.role, command.command, command.argument);
      await finishAction(actionId, "succeeded", { command: command.command });
      return { ok: true };
    }

    const session = await loadSession(userId);
    if (session) {
      const handled = await handleSessionMessage(chatId, userId, message, session);
      if (handled !== null) { await finishAction(actionId, "succeeded", { state: session.state }); return { ok: true }; }
    }

    const text = message.text?.trim();
    if (text) {
      await saveSession(userId, "direct_text", { text });
      const containsUrl = /https?:\/\/[^\s]+/u.test(text);
      await telegramClient.sendMessage(chatId, containsUrl ? "تم اكتشاف رابط. اختر الإجراء:" : "اختر كيف تحفظ النص:", containsUrl ? keyboards.linkDraft() : keyboards.textDraft());
      await finishAction(actionId, "succeeded", { kind: "direct_prompt" });
      return { ok: true };
    }

    await finishAction(actionId, "ignored", { reason: "UNSUPPORTED_MESSAGE" });
    return { ignored: true };
  } catch (error) {
    await finishAction(actionId, "failed", {}, error instanceof Error ? error.message : "unknown");
    try { await telegramClient.sendMessage(chatId, "حدث خطأ أثناء تنفيذ العملية. تم تسجيله دون إعادة تنفيذ الأمر تلقائيًا."); } catch { /* avoid masking original error */ }
    throw error;
  }
}
