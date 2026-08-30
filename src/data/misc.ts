import type { Announcement, DiaryEntry, LinkPost, Note, PopularPost } from "@/types/content";

export const announcements: Announcement[] = [{ id: "welcome", text: "✨ مرحبًا بك في مدونتي — تابع الجديد واشترك في قناة تيليجرام", href: "#newsletter", label: "تابع الجديد", dismissible: true }];
export const notes: Note[] = [
  { id: "n1", text: "فكرة اليوم: أفضل نظام للقراءة هو الذي تستطيع العودة إليه بعد انقطاع.", date: "2026-08-30" },
  { id: "n2", text: "الهوامش الجيدة أحيانًا تكون بداية مقال كامل.", date: "2026-08-26" },
  { id: "n3", text: "لا تجعل أداة التنظيم أكثر تعقيدًا من العمل الذي تنظمه.", date: "2026-08-20" },
];
export const diaries: DiaryEntry[] = [
  { id: "d1", date: "2026-08-30", title: "ملاحظة من يوم هادئ", excerpt: "مساحة قصيرة لتسجيل ما يستحق أن يبقى من تفاصيل اليوم.", slug: "quiet-day-2026-08-30" },
  { id: "d2", date: "2026-08-18", title: "بين كتابين", excerpt: "عن الانتقال من كتاب إلى آخر وما يتركه الأول في طريقة قراءة الثاني.", slug: "between-two-books" },
  { id: "d3", date: "2026-08-07", title: "ترتيب المكتب", excerpt: "تفصيل صغير غيّر إيقاع يوم كامل.", slug: "desk-reset" },
];
export const curatedLinks: LinkPost[] = [
  { id: "l1", title: "دليل لتصميم تجربة قراءة أفضل", domain: "example.com", note: "أفكار جيدة عن الطباعة والمساحات البيضاء.", href: "https://example.com" },
  { id: "l2", title: "مقال عن تدوين الملاحظات", domain: "example.org", note: "طرح بسيط ومفيد عن الاحتفاظ بالأفكار.", href: "https://example.org" },
  { id: "l3", title: "أرشيف بصري للكتب والهوامش", domain: "example.net", note: "مصدر إلهام بصري أكثر من كونه مرجعًا.", href: "https://example.net" },
];
export const popularPosts: PopularPost[] = [
  { slug: "slow-thinking-in-a-fast-world", title: "التفكير البطيء في عالم سريع جدًا", category: "thought", views: 4280 },
  { slug: "building-reading-habit", title: "كيف نصنع عادة القراءة؟", category: "culture", views: 3180 },
  { slug: "arabic-words-worth-returning", title: "كلمات عربية تستحق أن تعود", category: "language", views: 2890 },
  { slug: "reading-medicine-leaflet", title: "كيف نقرأ النشرة الدوائية؟", category: "pharmacy", views: 2710 },
  { slug: "generic-vs-brand-name", title: "ما الفرق بين الاسم العلمي والتجاري للدواء؟", category: "pharmacy", views: 2450 },
];
