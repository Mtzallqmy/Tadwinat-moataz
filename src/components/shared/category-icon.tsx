import { Brain, Cpu, Languages, Library, MoonStar, Pill, Sparkles, Stethoscope, UserRound } from "lucide-react";

const iconMap = { stethoscope: Stethoscope, pill: Pill, library: Library, languages: Languages, "moon-star": MoonStar, brain: Brain, cpu: Cpu, user: UserRound, sparkles: Sparkles };

export function CategoryIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const Icon = iconMap[name as keyof typeof iconMap] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
