-- Phase 2 authorization, Data API grants, and row-level security.

-- RLS policy expressions need a role lookup that cannot recurse through profiles RLS.
-- This is the one intentional SECURITY DEFINER use in the application schema. It lives
-- in a non-exposed schema, checks auth.uid(), has an empty search_path, and is not
-- executable by PUBLIC.
create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.is_active = true
  limit 1
$$;

revoke all on function private.current_app_role() from public;
revoke all on schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.set_updated_at() to authenticated;
grant execute on function private.enforce_menu_item_depth() to authenticated;

-- Defense-in-depth mutation guard for roles with constrained post editing rights.
create or replace function private.enforce_post_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role public.app_role := private.current_app_role();
begin
  if actor is null or actor_role is null then
    raise exception 'Unauthorized post mutation';
  end if;

  if actor_role in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role) then
    return new;
  end if;

  if actor_role = 'author'::public.app_role then
    if old.author_id <> actor or new.author_id <> actor then
      raise exception 'Authors can only edit their own posts';
    end if;
    if old.status not in ('draft'::public.post_status, 'review'::public.post_status, 'archived'::public.post_status)
       or new.status not in ('draft'::public.post_status, 'review'::public.post_status, 'archived'::public.post_status) then
      raise exception 'Authors cannot publish or edit published posts';
    end if;
    return new;
  end if;

  if actor_role = 'reviewer'::public.app_role then
    if old.status <> 'review'::public.post_status
       or new.status not in ('review'::public.post_status, 'draft'::public.post_status)
       or new.author_id <> old.author_id then
      raise exception 'Reviewers may only review or return review-stage posts';
    end if;
    return new;
  end if;

  raise exception 'Unauthorized post mutation';
end;
$$;

revoke all on function private.enforce_post_update() from public;
grant execute on function private.enforce_post_update() to authenticated;

create trigger posts_enforce_role_update
before update on public.posts
for each row execute function private.enforce_post_update();

-- Explicit Data API grants. RLS remains the row-level gate.
grant select (id, display_name, slug, bio, avatar_url, website, created_at, updated_at)
  on public.profiles to anon;
grant select on public.categories, public.tags, public.posts, public.post_categories,
  public.post_tags, public.media, public.menus, public.menu_items, public.announcements,
  public.homepage_sections, public.site_settings to anon;

grant select on public.profiles to authenticated;
grant insert (id, display_name, slug, bio, avatar_url, website) on public.profiles to authenticated;
grant update (display_name, slug, bio, avatar_url, website) on public.profiles to authenticated;

grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, update, delete on public.post_categories to authenticated;
grant select, insert, update, delete on public.post_tags to authenticated;
grant select, insert on public.post_revisions to authenticated;
grant select, insert, update, delete on public.media to authenticated;
grant select, insert, update, delete on public.menus to authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update, delete on public.homepage_sections to authenticated;
grant select, insert, update on public.site_settings to authenticated;
grant select, insert on public.audit_logs to authenticated;

-- profiles
create policy profiles_public_select
on public.profiles for select to anon
using (is_active = true);

create policy profiles_authenticated_select
on public.profiles for select to authenticated
using (
  is_active = true
  or id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role)
);

create policy profiles_self_insert
on public.profiles for insert to authenticated
with check (
  (select auth.uid()) is not null
  and id = (select auth.uid())
  and role = 'author'::public.app_role
  and is_active = true
);

create policy profiles_self_or_admin_update
on public.profiles for update to authenticated
using (
  id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role)
)
with check (
  id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role)
);

-- categories
create policy categories_public_select
on public.categories for select to anon
using (is_active = true);

create policy categories_authenticated_select
on public.categories for select to authenticated
using (
  is_active = true
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
);

create policy categories_staff_insert
on public.categories for insert to authenticated
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role));

create policy categories_staff_update
on public.categories for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role));

create policy categories_staff_delete
on public.categories for delete to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role));

-- tags
create policy tags_public_select
on public.tags for select to anon, authenticated
using (true);

create policy tags_staff_insert
on public.tags for insert to authenticated
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role));

create policy tags_staff_update
on public.tags for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role));

create policy tags_staff_delete
on public.tags for delete to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role));

-- posts
create policy posts_public_select
on public.posts for select to anon
using (
  status = 'published'::public.post_status
  and deleted_at is null
  and published_at is not null
  and published_at <= now()
);

create policy posts_authenticated_select
on public.posts for select to authenticated
using (
  (status = 'published'::public.post_status and deleted_at is null and published_at is not null and published_at <= now())
  or author_id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'reviewer'::public.app_role)
);

create policy posts_content_creator_insert
on public.posts for insert to authenticated
with check (
  private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'author'::public.app_role)
  and (
    private.current_app_role() <> 'author'::public.app_role
    or author_id = (select auth.uid())
  )
  and (
    private.current_app_role() <> 'author'::public.app_role
    or status in ('draft'::public.post_status, 'review'::public.post_status)
  )
);

create policy posts_editor_update
on public.posts for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role));

create policy posts_author_update
on public.posts for update to authenticated
using (
  private.current_app_role() = 'author'::public.app_role
  and author_id = (select auth.uid())
  and status in ('draft'::public.post_status, 'review'::public.post_status, 'archived'::public.post_status)
)
with check (
  private.current_app_role() = 'author'::public.app_role
  and author_id = (select auth.uid())
  and status in ('draft'::public.post_status, 'review'::public.post_status, 'archived'::public.post_status)
);

create policy posts_reviewer_update
on public.posts for update to authenticated
using (
  private.current_app_role() = 'reviewer'::public.app_role
  and status = 'review'::public.post_status
)
with check (
  private.current_app_role() = 'reviewer'::public.app_role
  and status in ('review'::public.post_status, 'draft'::public.post_status)
);

create policy posts_admin_delete
on public.posts for delete to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));

-- post_categories
create policy post_categories_public_select
on public.post_categories for select to anon
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and p.status = 'published'::public.post_status
    and p.deleted_at is null
    and p.published_at <= now()
));

create policy post_categories_authenticated_select
on public.post_categories for select to authenticated
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and (
      (p.status = 'published'::public.post_status and p.deleted_at is null and p.published_at <= now())
      or p.author_id = (select auth.uid())
      or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'reviewer'::public.app_role)
    )
));

create policy post_categories_staff_insert
on public.post_categories for insert to authenticated
with check (
  private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.status <> 'published'::public.post_status)
);

create policy post_categories_staff_update
on public.post_categories for update to authenticated
using (
  private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.status <> 'published'::public.post_status)
)
with check (
  private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.status <> 'published'::public.post_status)
);

create policy post_categories_staff_delete
on public.post_categories for delete to authenticated
using (
  private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.status <> 'published'::public.post_status)
);

-- post_tags
create policy post_tags_public_select
on public.post_tags for select to anon
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and p.status = 'published'::public.post_status
    and p.deleted_at is null
    and p.published_at <= now()
));

create policy post_tags_authenticated_select
on public.post_tags for select to authenticated
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and (
      (p.status = 'published'::public.post_status and p.deleted_at is null and p.published_at <= now())
      or p.author_id = (select auth.uid())
      or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'reviewer'::public.app_role)
    )
));

create policy post_tags_staff_insert
on public.post_tags for insert to authenticated
with check (
  private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.status <> 'published'::public.post_status)
);

create policy post_tags_staff_delete
on public.post_tags for delete to authenticated
using (
  private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.status <> 'published'::public.post_status)
);

-- revisions are immutable snapshots
create policy revisions_authenticated_select
on public.post_revisions for select to authenticated
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and (
      p.author_id = (select auth.uid())
      or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'reviewer'::public.app_role)
    )
));

create policy revisions_authenticated_insert
on public.post_revisions for insert to authenticated
with check (
  editor_id = (select auth.uid())
  and exists (
    select 1 from public.posts p
    where p.id = post_id
      and (
        private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
        or (private.current_app_role() = 'author'::public.app_role and p.author_id = (select auth.uid()) and p.status <> 'published'::public.post_status)
        or (private.current_app_role() = 'reviewer'::public.app_role and p.status = 'review'::public.post_status)
      )
  )
);

-- media metadata
create policy media_public_select
on public.media for select to anon
using (
  bucket = 'avatars'
  or exists (
    select 1 from public.posts p
    where p.cover_image_id = id
      and p.status = 'published'::public.post_status
      and p.deleted_at is null
      and p.published_at <= now()
  )
);

create policy media_authenticated_select
on public.media for select to authenticated
using (
  owner_id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'reviewer'::public.app_role)
  or bucket = 'avatars'
  or exists (
    select 1 from public.posts p
    where p.cover_image_id = id
      and p.status = 'published'::public.post_status
      and p.deleted_at is null
      and p.published_at <= now()
  )
);

create policy media_creator_insert
on public.media for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role, 'author'::public.app_role)
);

create policy media_staff_update
on public.media for update to authenticated
using (
  owner_id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
)
with check (
  owner_id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
);

create policy media_staff_delete
on public.media for delete to authenticated
using (
  owner_id = (select auth.uid())
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
);

-- menus and menu items
create policy menus_public_select
on public.menus for select to anon, authenticated
using (true);

create policy menus_admin_insert
on public.menus for insert to authenticated
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy menus_admin_update
on public.menus for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy menus_admin_delete
on public.menus for delete to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));

create policy menu_items_public_select
on public.menu_items for select to anon
using (is_visible = true);
create policy menu_items_authenticated_select
on public.menu_items for select to authenticated
using (is_visible = true or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy menu_items_admin_insert
on public.menu_items for insert to authenticated
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy menu_items_admin_update
on public.menu_items for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy menu_items_admin_delete
on public.menu_items for delete to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));

-- announcements
create policy announcements_public_select
on public.announcements for select to anon
using (
  is_active = true
  and (start_at is null or start_at <= now())
  and (end_at is null or end_at > now())
);
create policy announcements_authenticated_select
on public.announcements for select to authenticated
using (
  (is_active = true and (start_at is null or start_at <= now()) and (end_at is null or end_at > now()))
  or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role)
);
create policy announcements_admin_insert
on public.announcements for insert to authenticated
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy announcements_admin_update
on public.announcements for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy announcements_admin_delete
on public.announcements for delete to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));

-- homepage sections
create policy homepage_sections_public_select
on public.homepage_sections for select to anon
using (is_enabled = true);
create policy homepage_sections_authenticated_select
on public.homepage_sections for select to authenticated
using (is_enabled = true or private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy homepage_sections_admin_insert
on public.homepage_sections for insert to authenticated
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy homepage_sections_admin_update
on public.homepage_sections for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy homepage_sections_admin_delete
on public.homepage_sections for delete to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));

-- site settings
create policy site_settings_public_select
on public.site_settings for select to anon, authenticated
using (true);
create policy site_settings_admin_insert
on public.site_settings for insert to authenticated
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy site_settings_admin_update
on public.site_settings for update to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role))
with check (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));

-- audit logs are append-only from the application.
create policy audit_logs_admin_select
on public.audit_logs for select to authenticated
using (private.current_app_role() in ('owner'::public.app_role, 'admin'::public.app_role));
create policy audit_logs_staff_insert
on public.audit_logs for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.current_app_role() is not null
);
