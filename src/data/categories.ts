import type { Category } from "@/types/content";

export const categories: Category[] = [
  { slug: "medical", name: "طبي", description: "قراءات ومعلومات صحية وطبية عامة.", icon: "stethoscope", count: 12 },
  { slug: "pharmacy", name: "صيدلاني", description: "تبسيط مفاهيم دوائية وصيدلانية.", icon: "pill", count: 10 },
  { slug: "culture", name: "ثقافي", description: "كتب وقراءة وأفكار ثقافية.", icon: "library", count: 18 },
  { slug: "language", name: "لغوي", description: "لغة عربية وتعبير وبلاغة.", icon: "languages", count: 9 },
  { slug: "religion", name: "ديني", description: "تأملات عامة وقراءات معرفية.", icon: "moon-star", count: 8 },
  { slug: "thought", name: "فكري", description: "أسئلة وأفكار وتأملات.", icon: "brain", count: 14 },
  { slug: "technology", name: "تقني", description: "أدوات وتقنية وتجارب رقمية.", icon: "cpu", count: 11 },
  { slug: "personal", name: "شخصي", description: "تجارب وملاحظات شخصية.", icon: "user", count: 7 },
  { slug: "misc", name: "متنوع", description: "موضوعات لا يحدها تصنيف واحد.", icon: "sparkles", count: 6 },
];

export const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
