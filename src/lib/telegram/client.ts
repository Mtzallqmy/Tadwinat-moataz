import type { InlineKeyboard } from "@/lib/telegram/types";

export class TelegramError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "TelegramError";
  }
}

function token() {
  const value = process.env.TELEGRAM_BOT_TOKEN;
  if (!value || value.includes("placeholder")) throw new TelegramError("TELEGRAM_BOT_TOKEN_NOT_CONFIGURED");
  return value;
}

async function api<T>(method: string, body: Record<string, unknown>, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const payload = await response.json() as { ok?: boolean; result?: T; description?: string; parameters?: { retry_after?: number } };
    if (!response.ok || !payload.ok) {
      const retry = payload.parameters?.retry_after ? `; retry_after=${payload.parameters.retry_after}` : "";
      throw new TelegramError(`${payload.description ?? "Telegram API request failed"}${retry}`, response.status);
    }
    return payload.result as T;
  } catch (error) {
    if (error instanceof TelegramError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new TelegramError("TELEGRAM_TIMEOUT");
    throw new TelegramError(error instanceof Error ? error.message : "TELEGRAM_REQUEST_FAILED");
  } finally {
    clearTimeout(timer);
  }
}

export const telegramClient = {
  sendMessage(chatId: number | string, text: string, replyMarkup?: InlineKeyboard) {
    return api<{ message_id: number }>("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: replyMarkup });
  },
  editMessageText(chatId: number | string, messageId: number, text: string, replyMarkup?: InlineKeyboard) {
    return api("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: replyMarkup });
  },
  answerCallbackQuery(callbackQueryId: string, text?: string) {
    return api("answerCallbackQuery", { callback_query_id: callbackQueryId, text, show_alert: false });
  },
  sendPhoto(chatId: number | string, photo: string, caption?: string, replyMarkup?: InlineKeyboard) {
    return api<{ message_id: number }>("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML", reply_markup: replyMarkup });
  },
  sendDocument(chatId: number | string, document: string, caption?: string) {
    return api<{ message_id: number }>("sendDocument", { chat_id: chatId, document, caption, parse_mode: "HTML" });
  },
  getFile(fileId: string) {
    return api<{ file_id: string; file_size?: number; file_path?: string }>("getFile", { file_id: fileId });
  },
  async downloadFile(filePath: string, maximumBytes = 8 * 1024 * 1024) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`https://api.telegram.org/file/bot${token()}/${filePath}`, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new TelegramError("TELEGRAM_FILE_DOWNLOAD_FAILED", response.status);
      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > maximumBytes) throw new TelegramError("TELEGRAM_FILE_TOO_LARGE");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > maximumBytes) throw new TelegramError("TELEGRAM_FILE_TOO_LARGE");
      return { bytes, contentType: response.headers.get("content-type") ?? "application/octet-stream" };
    } finally {
      clearTimeout(timer);
    }
  },
};
