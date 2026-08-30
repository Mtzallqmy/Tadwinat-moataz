# معتز العلقمي

منصة شخصية عربية للنشر والمعرفة والتدوين.

## المرحلة الأولى

هذه النسخة تبني الأساس التقني والهوية البصرية ونظام التصميم والواجهة العامة باستخدام Next.js App Router وTypeScript وTailwind CSS، مع تجهيز Supabase فقط دون Schema أو Backend إنتاجي.

## التشغيل

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

## التحقق

```bash
pnpm lint
pnpm typecheck
pnpm build
```

> جميع بيانات المحتوى الحالية Mock داخل `src/data`، ويمكن استبدال Data Access Layer بمصدر Supabase لاحقًا دون إعادة كتابة مكونات العرض.
