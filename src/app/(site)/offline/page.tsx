import { Container } from "@/components/shared/container";
import { StatePanel } from "@/components/shared/state-panels";

export default function OfflinePage() {
  return <main className="py-16"><Container><StatePanel variant="offline" description="تحقق من الاتصال ثم أعد تحميل الصفحة. هذه واجهة حالة جاهزة لربطها لاحقًا باستراتيجية Offline/PWA إن لزم." /></Container></main>;
}
