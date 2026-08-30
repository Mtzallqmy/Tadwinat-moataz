# Architecture

## المكونات

- **Next.js 16 App Router**: الواجهة العامة، CMS، Route Handlers، Server Actions.
- **Supabase Auth**: جلسات CMS بدون public signup.
- **Supabase PostgreSQL**: schema `blog` للمحتوى والتكاملات، مع RLS وexplicit grants.
- **Supabase Storage**: `blog-media` وموارد الصور وفق سياسات Storage.
- **Telegram Bot API**: Webhook Server-only مع allowlist وصلاحيات owner/admin/editor.
- **Resend**: Adapter بريد Server-only للنشرة والتأكيدات.

## حدود الثقة

Browser -> Publishable Key -> Data API -> RLS

Server Route/Action -> تحقق هوية/Capability أو Cron/Webhook secret -> Secret Key -> DB/Storage/Provider

لا يُستخدم Secret Key داخل Client Components.

## النشر والجدولة

`blog.publish_due_posts()` هو المسار الذري للنشر المجدول. يوجد `pg_cron` مركزي كل دقيقة في Supabase. مسار `/api/cron/publish` مخصص للمصالحة/revalidation وتشغيل automation hooks عند استخدام Scheduler خارجي.

## Integration flow

- Telegram update -> تحقق webhook secret -> allowlist/role -> idempotency log -> domain service.
- Newsletter signup -> public RPC محدود + token hash -> email confirmation -> confirm RPC.
- Campaign -> deliveries idempotent -> provider adapter -> retry state.
- Automation event -> rule match -> idempotency key -> run/retry log.

## Observability

`blog.system_job_runs` يسجل publish/integrations/maintenance بدون أسرار. `/admin/system` يعرض حالة المكونات والآخر الناجح/الفاشل دون القيم السرية.

## PWA

Service Worker public-only. Admin/Auth/API/Preview/Newsletter flows خارج cache بالكامل. Offline fallback لا يحتوي بيانات خاصة.
