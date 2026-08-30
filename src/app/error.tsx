"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-md">
        <TriangleAlert className="mx-auto size-9 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-black">تعذر عرض الصفحة</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">حدث خطأ أثناء تحميل هذا الجزء. يمكنك المحاولة مرة أخرى.</p>
        <button onClick={reset} type="button" className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">إعادة المحاولة</button>
      </div>
    </main>
  );
}
