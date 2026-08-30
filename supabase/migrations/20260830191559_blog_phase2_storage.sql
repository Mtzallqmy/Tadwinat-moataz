insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('blog-media','blog-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
 ('blog-avatars','blog-avatars',true,5242880,array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy blog_storage_insert on storage.objects for insert to authenticated with check(
 bucket_id in ('blog-media','blog-avatars')
 and blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'author'::blog.app_role)
 and (storage.foldername(name))[1]=(select auth.uid()::text)
 and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif','gif')
);
create policy blog_storage_select on storage.objects for select to authenticated using(
 bucket_id in ('blog-media','blog-avatars')
 and (owner_id=(select auth.uid()::text) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role))
);
create policy blog_storage_update on storage.objects for update to authenticated
using(bucket_id in ('blog-media','blog-avatars') and (owner_id=(select auth.uid()::text) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)))
with check(bucket_id in ('blog-media','blog-avatars') and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif','gif') and (owner_id=(select auth.uid()::text) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)));
create policy blog_storage_delete on storage.objects for delete to authenticated using(
 bucket_id in ('blog-media','blog-avatars')
 and (owner_id=(select auth.uid()::text) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role))
);
