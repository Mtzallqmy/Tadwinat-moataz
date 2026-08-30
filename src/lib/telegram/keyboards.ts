import type { InlineKeyboard } from "@/lib/telegram/types";

export const keyboards = {
  home(): InlineKeyboard { return { inline_keyboard: [[{ text: "📝 مقال جديد", callback_data: "new:article" }, { text: "📄 المسودات", callback_data: "list:drafts" }], [{ text: "⏰ المجدولة", callback_data: "list:queue" }, { text: "📰 آخر المنشورات", callback_data: "list:latest" }], [{ text: "📊 الإحصاءات", callback_data: "stats" }]] }; },
  newTypes(): InlineKeyboard { return { inline_keyboard: [[{ text: "مقال", callback_data: "new:article" }, { text: "تدوينة", callback_data: "new:note" }], [{ text: "يومية", callback_data: "new:diary" }, { text: "قصة", callback_data: "new:story" }], [{ text: "رابط", callback_data: "new:link" }, { text: "إلغاء", callback_data: "cancel" }]] }; },
  preview(postId?: string): InlineKeyboard { return { inline_keyboard: [[{ text: "💾 حفظ كمسودة", callback_data: "draft:save" }, ...(postId ? [{ text: "🚀 نشر الآن", callback_data: `publish:${postId}` }] : [])], [...(postId ? [{ text: "⏰ جدولة", callback_data: `schedule:${postId}` }] : []), { text: "إلغاء", callback_data: "cancel" }]] }; },
  draft(postId: string): InlineKeyboard { return { inline_keyboard: [[{ text: "🚀 نشر", callback_data: `publish:${postId}` }, { text: "⏰ جدولة", callback_data: `schedule:${postId}` }], [{ text: "🗄 أرشفة", callback_data: `archive:${postId}` }]] }; },
  queue(postId: string): InlineKeyboard { return { inline_keyboard: [[{ text: "🚀 نشر الآن", callback_data: `publish:${postId}` }, { text: "🕒 تعديل الموعد", callback_data: `reschedule:${postId}` }], [{ text: "إلغاء الجدولة", callback_data: `cancel_schedule:${postId}` }]] }; },
  linkDraft(): InlineKeyboard { return { inline_keyboard: [[{ text: "🔗 مشاركة كرابط", callback_data: "direct:link" }, { text: "📝 مسودة مقال", callback_data: "direct:article" }], [{ text: "إلغاء", callback_data: "cancel" }]] }; },
  textDraft(): InlineKeyboard { return { inline_keyboard: [[{ text: "✍️ تدوينة قصيرة", callback_data: "direct:note" }, { text: "📝 مسودة مقال", callback_data: "direct:article" }], [{ text: "إلغاء", callback_data: "cancel" }]] }; },
  photo(): InlineKeyboard { return { inline_keyboard: [[{ text: "🖼 إضافة لمكتبة الوسائط", callback_data: "photo:library" }, { text: "📝 إنشاء تدوينة", callback_data: "photo:note" }], [{ text: "إلغاء", callback_data: "cancel" }]] }; },
};
