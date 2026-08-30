# Production Runbook

## قبل النشر

1. تأكد أن GitHub Quality أخضر: install/lint/typecheck/tests/build/runtime smoke.
2. راجع Supabase Advisors وRLS/grants.
3. اضبط متغيرات Vercel Production، واجعل Server secrets Sensitive.
4. لا تستخدم بيانات Production في Preview إلا للقراءة المقصودة؛ الأفضل مشروع/فرع منفصل عند توفره.

## بعد Preview

- افتح `/api/health` وتوقع `{ ok: true }`.
- افحص الرئيسية، مقال، بحث، contact، newsletter، login وadmin.
- افحص Response headers وPWA manifest وService Worker.
- تأكد أن `/admin/*` و`/api/preview/*` ترجع `Cache-Control: private, no-store`.

## Cron

`CRON_SECRET` يجب أن يكون random >= 16 chars. Vercel يرسل قيمته كـ`Authorization: Bearer ...` عند استخدام Vercel Cron.

Endpoints:
- `/api/cron/publish`
- `/api/cron/integrations`
- `/api/cron/maintenance`

على Vercel Hobby الحد الأدنى للـCron مرة يوميًا. لا تضبط تعبيرات أسرع على Hobby لأنها تفشل deployment. Supabase `pg_cron` يتولى نشر المقالات المجدولة كل دقيقة أصلًا.

## Telegram

بعد وجود Production URL:
1. ضع `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_OWNER_IDS`.
2. اضبط webhook إلى `https://DOMAIN/api/telegram/webhook` مع secret token نفسه.
3. اختبر مستخدمًا غير مصرح ثم owner.
4. اختبر draft ثم publish/schedule على محتوى تجريبي.

## Email

1. تحقق من Domain في Resend.
2. اضبط SPF/DKIM، وDMARC في DNS.
3. ضع `RESEND_API_KEY` و`NEWSLETTER_FROM`.
4. اختبر confirmation ثم unsubscribe ثم test campaign.

## Rollback

- في Vercel استخدم Instant Rollback إلى deployment معروف سليم.
- لا تعمل rollback لقاعدة البيانات بإسقاط جداول. migrations للأمام فقط قدر الإمكان.
- إذا كان الخلل من migration: عطّل feature عبر UI/cron، خذ export/backup، ثم طبّق migration تصحيحية.
- راقب أن Vercel Cron قد يستمر بالجدول الحالي بعد rollback؛ راجعه يدويًا.

## Incident basics

1. عطّل Integration المسبب إن أمكن.
2. دوّر secret إذا اشتبه في تسربه.
3. افحص Vercel runtime logs وSupabase Auth/API/Postgres logs.
4. افحص `/admin/system` و`system_job_runs` و`automation_runs`.
5. لا تنسخ tokens أو email bodies أو secrets إلى Issue عامة.
