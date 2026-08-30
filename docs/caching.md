# Caching Policy

## لا يُخزن

- `/admin/**`
- `/auth/**`
- `/api/admin/**`
- `/api/preview/**`
- `/api/cron/**`
- `/api/telegram/**`
- Newsletter token/action flows

Proxy يضيف `private, no-store` للمسارات الحساسة. Service Worker يتجاهلها بالكامل.

## PWA cache

- Offline page والأيقونات precache.
- أصول `_next/static` والصور/fonts العامة cache-first داخل cache versioned.
- تنقلات القراءة العامة network-first مع fallback مخزن.
- تحديث Service Worker يزيل cache versions القديمة.

## Content revalidation

النشر اليدوي والمسارات المدعومة تستدعي revalidation helpers. النشر المجدول الأساسي داخل Supabase يجب أن يبقى متوافقًا مع استراتيجية القراءة؛ إذا أضيف ISR طويل المدة مستقبلًا، يجب ربط scheduler بـrevalidation قبل اعتماده.
