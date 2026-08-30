-- Expose media metadata only when a public published surface references it.
drop policy blog_media_public_select on blog.media;
create policy blog_media_public_select on blog.media for select to anon using(
  bucket='blog-avatars'
  or exists(select 1 from blog.posts p where (p.cover_image_id=blog.media.id or p.og_image_id=blog.media.id or p.twitter_image_id=blog.media.id) and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at is not null and p.published_at<=now())
  or exists(select 1 from blog.site_settings s where s.default_og_image_id=blog.media.id)
);
drop policy blog_media_authenticated_select on blog.media;
create policy blog_media_authenticated_select on blog.media for select to authenticated using(
  owner_id=(select auth.uid())
  or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role)
  or bucket='blog-avatars'
  or exists(select 1 from blog.posts p where (p.cover_image_id=blog.media.id or p.og_image_id=blog.media.id or p.twitter_image_id=blog.media.id) and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at is not null and p.published_at<=now())
  or exists(select 1 from blog.site_settings s where s.default_og_image_id=blog.media.id)
);
