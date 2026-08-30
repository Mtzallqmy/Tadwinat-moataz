# معتز العلقمي

منصة عربية شخصية للنشر والمعرفة والتدوين، مبنية بـ Next.js App Router وTypeScript وSupabase PostgreSQL/Auth/Storage.

## الحالة

الفرع `feature/phase-5-production-launch` هو فرع الإطلاق. لا يتم دمجه تلقائيًا. يشمل CMS، النشر والجدولة، SEO/GEO، البحث، Telegram، Newsletter، Contact، Automation، Analytics، PWA، Production hardening وعمليات الصيانة.

## المتطلبات

- Node.js 22+
- pnpm 11.24+
- مشروع Supabase مع schema باسم `blog`

## التشغيل المحلي

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

## التحقق قبل أي نشر

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

ثم افحص `/api/health` و`/` و`/offline` و`/manifest.webmanifest`.

## Environment Variables

راجع `.env.example`. مفاتيح `NEXT_PUBLIC_*` فقط مسموح بوصولها للمتصفح. `SUPABASE_SECRET_KEY` و`CRON_SECRET` وTelegram وResend أسرار Server-only ولا يجب تضمينها في Git أو في أي bundle عميل.

## Supabase

- الواجهة العامة تستخدم Publishable Key + RLS.
- عمليات الخادم الموثوقة تستخدم `SUPABASE_SECRET_KEY` فقط بعد Authorization مناسب أو حماية Cron/Webhook.
- Schema التطبيق هو `blog`; الجداول القديمة في `public` خارج نطاق هذه المنصة.
- النشر المجدول الأساسي مركزي عبر `pg_cron` و`blog.publish_due_posts`.
- Maintenance الآمن عبر `blog.run_maintenance()`، ولا يحذف `audit_logs` أو محتوى المستخدم.

## Production Operations

- Public liveness: `/api/health`
- Admin health: `/admin/system`
- Owner-only JSON export: `/api/admin/export`
- Cron publish reconciliation: `/api/cron/publish`
- Cron integrations: `/api/cron/integrations`
- Cron retention: `/api/cron/maintenance`

جميع مسارات الإدارة/المعاينة/Cron/Webhook تضبط `no-store`، والـService Worker لا يخزنها.

## PWA

`app/manifest.ts` + `public/sw.js` + Offline fallback. التخزين المؤقت مقتصر على الأصول العامة ومسارات القراءة العامة؛ لا يتم تخزين Admin/Auth/API/Newsletter token flows.

## النشر على Vercel

1. اربط المستودع بمشروع Vercel.
2. أضف متغيرات Production من `.env.example`، واجعل الأسرار Sensitive.
3. اضبط `NEXT_PUBLIC_SITE_URL` على الدومين النهائي HTTPS.
4. انشر Preview أولًا وافحص `/api/health` وRuntime Logs.
5. بعد Production اضبط Telegram webhook ودومين Resend وCron المناسب لخطة Vercel.

> Vercel Hobby يسمح للـCron بالتشغيل مرة واحدة يوميًا فقط؛ لا تضف جداول دقيقة/متكررة في `vercel.json` إذا كان المشروع Hobby. النشر المجدول للمقالات لا يعتمد على Vercel Cron لأنه موجود في Supabase `pg_cron`.

## الوثائق التشغيلية

- `docs/architecture.md`
- `docs/runbook.md`
- `docs/disaster-recovery.md`
- `docs/data-retention.md`
- `docs/caching.md`
- `docs/launch-checklist.md`

## Security

- CSP + HSTS في Production + clickjacking/MIME/referrer/permissions headers.
- RLS هو الحد الأساسي للـData API.
- لا public signup.
- Webhooks/Cron يستخدمان secrets مع مقارنة ثابتة الزمن حيث يلزم.
- HTML المنشور يمر عبر allowlist sanitizer.
- لا تحفظ أسرارًا في `site_settings` أو في Git.

إذا ظهر Secret في سجل محادثة أو Issue أو Log أو Commit، اعتبره مكشوفًا وقم بتدويره فورًا.
