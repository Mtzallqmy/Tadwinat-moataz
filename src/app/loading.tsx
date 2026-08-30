import { CardSkeleton } from "@/components/shared/state-panels";
import { Container } from "@/components/shared/container";

export default function Loading() {
  return (
    <main className="py-12">
      <Container>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      </Container>
    </main>
  );
}
