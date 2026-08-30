import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "دخول لوحة التحكم" };

const messages: Record<string, string> = {
  config: "لم يتم ربط بيئة Supabase بعد.",
  invalid: "تحقق من البريد الإلكتروني وكلمة المرور.",
  credentials: "بيانات الدخول غير صحيحة.",
  unauthorized: "هذا الحساب غير مصرح له باستخدام لوحة التحكم.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const message = params.error ? messages[params.error] : null;

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-12">
      <section className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-primary">معتز العلقمي</p>
            <h1 className="text-2xl font-black tracking-tight">دخول لوحة التحكم</h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-7 text-muted-foreground">
          لوحة خاصة لإدارة المحتوى. لا يوجد تسجيل عام للحسابات.
        </p>

        {message ? (
          <div role="alert" className="mb-5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
            {message}
          </div>
        ) : null}

        <form action={loginAction} className="grid gap-4">
          <input type="hidden" name="next" value={params.next ?? "/admin"} />
          <label className="grid gap-2 text-sm font-bold" htmlFor="email">
            البريد الإلكتروني
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
              className="h-11 rounded-xl border border-border bg-background px-3 text-left outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold" htmlFor="password">
            كلمة المرور
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="h-11 rounded-xl border border-border bg-background px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <button type="submit" className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            تسجيل الدخول
          </button>
        </form>

        <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground">
          العودة إلى الموقع
        </Link>
      </section>
    </main>
  );
}
