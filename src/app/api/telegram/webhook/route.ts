import { NextResponse, type NextRequest } from "next/server";
import { webhookSecretMatches } from "@/lib/telegram/auth";
import { handleTelegramUpdate } from "@/lib/telegram/handler";
import type { TelegramUpdate } from "@/lib/telegram/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!webhookSecretMatches(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!Number.isSafeInteger(update.update_id)) {
    return NextResponse.json({ ok: false, error: "invalid_update" }, { status: 400 });
  }

  try {
    const result = await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[telegram] webhook failed", error instanceof Error ? error.message : "unknown");
    // Return 200 after persisting failure so Telegram retries cannot duplicate a destructive action.
    return NextResponse.json({ ok: true, handled: false });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
