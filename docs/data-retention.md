# Data Retention

## آلي

`blog.run_maintenance()` يقوم فقط بـ:
- حذف Telegram sessions المنتهية.
- حذف rate-limit rows الأقدم من 48 ساعة.
- تنقيح request/result payload في `telegram_actions` بعد 30 يومًا مع إبقاء سجل العملية والحالة.
- حذف `system_job_runs` الأقدم من 180 يومًا.

## لا يُحذف تلقائيًا

- `audit_logs`
- Posts/Revisions
- Subscribers
- Contact messages
- Newsletter deliveries
- Automation runs
- Analytics events

هذه البيانات تحتاج سياسة أعمال واضحة قبل إضافة حذف دائم. لا يُضاف retention عدواني لمجرد تقليل الحجم.

## تشغيل

شغّل `/api/cron/maintenance` بشكل دوري مع `CRON_SECRET`. مرة يوميًا مناسبة لهذه المهام.
