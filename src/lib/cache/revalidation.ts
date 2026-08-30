import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidatePublishing(input: { slug?: string; categorySlugs?: string[] }) {
  const tasks: (() => void)[] = [
    () => revalidatePath("/", "layout"),
    () => revalidatePath("/posts"),
    () => revalidatePath("/search"),
    () => revalidatePath("/sitemap.xml"),
    () => revalidatePath("/feed.xml"),
    () => revalidatePath("/rss.xml"),
    () => revalidatePath("/atom.xml"),
    () => revalidatePath("/feed.json"),
  ];
  if (input.slug) tasks.push(() => revalidatePath(`/posts/${input.slug}`));
  for (const category of input.categorySlugs ?? []) tasks.push(() => revalidatePath(`/category/${category}`));
  for (const task of tasks) task();
  revalidateTag("published-posts", "max");
  revalidateTag("site-settings", "max");
}
