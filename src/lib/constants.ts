export const siteConfig = { name: "معتز العلقمي", description: "منصة شخصية للنشر والمعرفة والتدوين", longDescription: "مساحة شخصية أشارك فيها أفكاري وقراءاتي وتجربتي في الطب والصيدلة والثقافة واللغة والدين والفكر والحياة.", url: "https://example.com" } as const;

export const contentTypes = [
  { value: "article", name: "مقالات", description: "قراءات وموضوعات معمقة." },
  { value: "note", name: "تدوينات", description: "أفكار وملاحظات سريعة." },
  { value: "diary", name: "يوميات", description: "لحظات وتجارب من الحياة." },
  { value: "story", name: "قصص", description: "حكايات ومشاهد قصيرة." },
  { value: "link", name: "روابط", description: "أشياء تستحق القراءة والمشاهدة." },
] as const;
