const arabicDate = new Intl.DateTimeFormat("ar", { year: "numeric", month: "long", day: "numeric" });
const arabicNumber = new Intl.NumberFormat("ar");
export function formatDate(value: string) { return arabicDate.format(new Date(`${value}T12:00:00Z`)); }
export function formatNumber(value: number) { return arabicNumber.format(value); }
