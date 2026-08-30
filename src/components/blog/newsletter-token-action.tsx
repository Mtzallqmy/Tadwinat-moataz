"use client";

import { useActionState } from "react";
import type { NewsletterActionState } from "@/app/(site)/newsletter/actions";

const initialState: NewsletterActionState = { ok: false, message: "" };

type TokenAction = (previous: NewsletterActionState, formData: FormData) => Promise<NewsletterActionState>;

export function NewsletterTokenAction({ token, action, buttonLabel }: { token: string; action: TokenAction; buttonLabel: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="mt-6 grid gap-3">
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={pending || !token} className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60">{pending ? "جارٍ التنفيذ…" : buttonLabel}</button>
      <p aria-live="polite" className={`min-h-6 text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>{state.message}</p>
    </form>
  );
}
