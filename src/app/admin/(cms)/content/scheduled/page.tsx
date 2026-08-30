import Link from "next/link";
import { cancelScheduleAction, publishPostNowAction } from "@/app/admin/(cms)/content/actions";
import { requireCmsUser } from "@/lib/auth/authorization";
import { formatInTimeZone } from "@/lib/datetime/timezone";
import { postsRepository } from "@/lib/repositories/posts";
import { settingsRepository } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

const secondary = "inline-flex min-h-9 items-center rounded-xl border border-border bg-background px-3 text-xs font-bold";
const primary = "inline-flex min-h-9 items-center rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground";

export default async function ScheduledPage() {
  await requireCmsUser("content.read");
  const [page, settings] = await Promise.all([
    postsRepository.listAdmin({ status: "scheduled", pageSize: 100 }),
    settingsRepository.getPublic(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black">قائمة النشر المجدول</h1>
      <p className="mt-1 text-sm text-muted-foreground">المنطقة الزمنية: {settings.timezone}</p>
      <div className="mt-5 grid gap-3">
        {page.posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black">{post.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{post.scheduledAt ? formatInTimeZone(post.scheduledAt, settings.timezone) : "بلا موعد"} · {post.author?.name ?? "—"}</p>
                {post.lastPublishError ? <p className="mt-2 text-xs text-destructive">آخر خطأ: {post.lastPublishError} (محاولات: {post.publishAttempts ?? 0})</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/content/${post.id}/edit`} className={secondary}>تحرير</Link>
                <form action={async () => { "use server"; if (post.id) await publishPostNowAction(post.id); }}><button className={primary}>نشر الآن</button></form>
                <form action={async () => { "use server"; if (post.id) await cancelScheduleAction(post.id); }}><button className={secondary}>إلغاء الجدولة</button></form>
              </div>
            </div>
          </article>
        ))}
        {!page.posts.length ? <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">لا توجد مواد مجدولة.</p> : null}
      </div>
    </div>
  );
}
