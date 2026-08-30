-- Phase 2 Storage buckets and RLS.
-- Public buckets are intentional for blog/publication assets; write operations remain protected.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'media',
    'media',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads always use a user-scoped first folder: <auth.uid()>/<uuid>.<ext>.
create policy cms_storage_insert
on storage.objects for insert to authenticated
with check (
  bucket_id in ('media', 'avatars')
  and private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'author'::public.app_role)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif', 'gif')
);

-- SELECT is required for list operations, upload RETURNING metadata, and upsert.
create policy cms_storage_select
on storage.objects for select to authenticated
using (
  bucket_id in ('media', 'avatars')
  and (
    owner_id = (select auth.uid()::text)
    or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  )
);

create policy cms_storage_update
on storage.objects for update to authenticated
using (
  bucket_id in ('media', 'avatars')
  and (
    owner_id = (select auth.uid()::text)
    or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  )
)
with check (
  bucket_id in ('media', 'avatars')
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif', 'gif')
  and (
    owner_id = (select auth.uid()::text)
    or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  )
);

create policy cms_storage_delete
on storage.objects for delete to authenticated
using (
  bucket_id in ('media', 'avatars')
  and (
    owner_id = (select auth.uid()::text)
    or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  )
);
