import { ContentEditor } from "@/components/admin/content-editor";
import { hasCapability, requireCmsUser } from "@/lib/auth/authorization";
import { categoriesRepository } from "@/lib/repositories/categories";
import { mediaRepository } from "@/lib/repositories/media";
import { settingsRepository } from "@/lib/repositories/settings";
import { tagsRepository } from "@/lib/repositories/tags";

export const dynamic = "force-dynamic";

export default async function NewContentPage() {
  const user = await requireCmsUser("content.create");
  const [categories, tags, media, settings] = await Promise.all([
    categoriesRepository.listAdmin(),
    tagsRepository.list(),
    mediaRepository.listAdmin({ pageSize: 100 }),
    settingsRepository.getPublic(),
  ]);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-black">محتوى جديد</h1>
      <ContentEditor
        categories={categories.filter((item) => item.id).map((item) => ({ id: item.id!, name: item.name, slug: item.slug }))}
        tags={tags.filter((item) => item.id).map((item) => ({ id: item.id!, name: item.name, slug: item.slug }))}
        media={media.items}
        canPublish={hasCapability(user.role, "content.publish")}
        timezone={settings.timezone}
      />
    </div>
  );
}
