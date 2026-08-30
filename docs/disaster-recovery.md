# Disaster Recovery

## أهداف الحماية

الأصل الأساسي هو PostgreSQL schema `blog` مع Storage `blog-media`. Git هو مصدر الكود والمigrations، وليس نسخة من بيانات المستخدم.

## App-level export

الـOwner يستطيع تنزيل JSON من `/api/admin/export`. يشمل Posts/Categories/Tags/Settings فقط ولا يشمل Subscribers/Contact/Telegram secrets.

احتفظ بنسخة دورية مشفرة خارج المنصة، خصوصًا قبل migrations كبيرة.

## Database backups

استخدم إمكانات Backup/PITR المتاحة لخطة Supabase الفعلية، وراجع Dashboard قبل الاعتماد على مدة احتفاظ مفترضة. المنظمة الحالية على Free؛ لا تفترض وجود PITR مدفوع.

## Storage

احفظ نسخة منفصلة من كائنات `blog-media` دوريًا مع الحفاظ على paths. تصدير JSON وحده لا يحتوي bytes للصور.

## Restore order

1. استعد/أنشئ قاعدة غير Production.
2. طبّق migrations بالترتيب.
3. استعد بيانات `blog`.
4. استعد Storage paths.
5. ولّد TypeScript types إن تغير schema.
6. شغّل RLS probes وintegrity queries وbuild.
7. اختبر login/public read/editor publish قبل أي تحويل Traffic.

## Restore drill

لا يتم اختبار restore على قاعدة Production. نفذه على Supabase Development Branch أو مشروع منفصل. إنشاء Branch له تكلفة مستقلة ويحتاج موافقة صريحة، لذلك لا ينشأ تلقائيًا من هذا المستودع.

معيار النجاح: عدد Posts/Categories/Tags مطابق، لا orphan relations، Published فقط مرئي للanon، media paths سليمة، ويمكن owner login والنشر دون تعديل Production.
