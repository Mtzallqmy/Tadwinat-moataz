# Launch Checklist

## Git / CI

- [ ] Phase 5 PR مفتوح ولا يوجد auto-merge.
- [ ] Frozen install أخضر.
- [ ] Lint / Typecheck / Tests / Production Build / Runtime Smoke خضراء.

## Supabase

- [ ] المشروع ACTIVE_HEALTHY.
- [ ] RLS/grants audit مكتمل.
- [ ] anon لا يرى Drafts.
- [ ] Advisors راجعت بعد آخر migration.
- [ ] Leaked Password Protection مفعلة إن كانت متاحة للحساب.
- [ ] App export محفوظ قبل الإطلاق.

## Vercel

- [ ] Preview أولًا.
- [ ] Environment Variables Production مضافة.
- [ ] Secrets محددة Sensitive.
- [ ] `NEXT_PUBLIC_SITE_URL` هو HTTPS النهائي.
- [ ] `/api/health` 200.
- [ ] Runtime logs بلا أخطاء جديدة.
- [ ] Security headers ظاهرة.
- [ ] PWA installable وOffline يعمل.

## Integrations

- [ ] Telegram webhook على Production URL + secret token.
- [ ] Telegram unauthorized/owner flows مختبرة.
- [ ] Resend domain verified.
- [ ] SPF/DKIM ويفضل DMARC.
- [ ] Double opt-in + unsubscribe مختبران.
- [ ] Test campaign ناجحة.
- [ ] Cron frequency متوافقة مع خطة Vercel.

## SEO / UX

- [ ] robots/sitemap/canonical/feeds على الدومين النهائي.
- [ ] OG cards مختبرة.
- [ ] Search Console/Bing بعد الإطلاق.
- [ ] Mobile + keyboard + focus + RTL visual pass.
- [ ] Lighthouse/real performance pass بعد وجود URL عام.

## Recovery

- [ ] Database backup capability verified in Supabase Dashboard.
- [ ] Storage backup محفوظ.
- [ ] Restore drill على non-production عند توفر Branch/Project منفصل.
