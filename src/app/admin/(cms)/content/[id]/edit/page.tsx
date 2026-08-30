import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/content-editor";
import { hasCapability, requireCmsUser } from "@/lib/auth/authorization";
import { editorInitialFromRow } from "@/lib/content/editor-data";
import { categoriesRepository } from "@/lib/repositories/categories";
import { mediaRepository } from "@/lib/repositories/media";
import { postsRepository } from "@/lib/repositories/posts";
import { settingsRepository } from "@/lib/repositories/settings";
import { tagsRepository } from "@/lib/repositories/tags";

export const dynamic = "force-dynamic";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCmsUser("content.read");
  const { id } = await params;
  const [row, categories, tags, media, settings] = await Promise.all([
    postsRepository.getAdminById(id),
    categoriesRepository.listAdmin(),
    tagsRepository.list(),
    mediaRepository.listAdmin({ pageSize: 100 }),
    settingsRepository.getPublic(),
  ]);

  if (!row) notFound();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-black">تحرير المحتوى</h1>
      <ContentEditor
        initial={editorInitialFromRow(row)}
        categories={categories.filter((item) => item.id).map((item) => ({ id: item.id!, name: item.name, slug: item.slug }))}
        tags={tags.filter((item) => item.id).map((item) => ({ id: item.id!, name: item.name, slug: item.slug }))}
        media={media.items}
        canPublish={hasCapability(user.role, "content.publish")}
        timezone={settings.timezone}
      />
    </div>
  );
}
