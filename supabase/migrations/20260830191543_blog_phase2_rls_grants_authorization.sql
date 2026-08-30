-- Authorization, explicit Data API grants, and RLS for the isolated blog schema.
create or replace function blog_private.current_app_role()
returns blog.app_role language sql stable security definer set search_path=''
as $$ select p.role from blog.profiles p where p.id=(select auth.uid()) and p.is_active=true limit 1 $$;
revoke all on function blog_private.current_app_role() from public;
grant usage on schema blog_private to authenticated;
grant execute on function blog_private.current_app_role() to authenticated;
grant execute on function blog_private.set_updated_at() to authenticated;
grant execute on function blog_private.enforce_menu_item_depth() to authenticated;

create or replace function blog_private.enforce_profile_security()
returns trigger language plpgsql set search_path=''
as $$
declare actor_role blog.app_role := blog_private.current_app_role();
begin
  if old.id<>new.id then raise exception 'Profile id cannot be changed'; end if;
  if actor_role not in ('owner'::blog.app_role,'admin'::blog.app_role) and (old.role<>new.role or old.is_active<>new.is_active) then
    raise exception 'Only owner or admin may change role or active state';
  end if;
  return new;
end; $$;
revoke all on function blog_private.enforce_profile_security() from public;
grant execute on function blog_private.enforce_profile_security() to authenticated;
create trigger blog_profiles_enforce_security before update on blog.profiles for each row execute function blog_private.enforce_profile_security();

create or replace function blog_private.enforce_post_update()
returns trigger language plpgsql set search_path=''
as $$
declare actor uuid := (select auth.uid()); actor_role blog.app_role := blog_private.current_app_role();
begin
  if actor is null or actor_role is null then raise exception 'Unauthorized post mutation'; end if;
  if actor_role in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) then return new; end if;
  if actor_role='author'::blog.app_role then
    if old.author_id<>actor or new.author_id<>actor then raise exception 'Authors can only edit their own posts'; end if;
    if old.status not in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status) or new.status not in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status) then raise exception 'Authors cannot publish or edit published posts'; end if;
    return new;
  end if;
  if actor_role='reviewer'::blog.app_role then
    if old.status<>'review'::blog.post_status or new.status not in ('review'::blog.post_status,'draft'::blog.post_status) or new.author_id<>old.author_id then raise exception 'Reviewers may only review or return review-stage posts'; end if;
    return new;
  end if;
  raise exception 'Unauthorized post mutation';
end; $$;
revoke all on function blog_private.enforce_post_update() from public;
grant execute on function blog_private.enforce_post_update() to authenticated;
create trigger blog_posts_enforce_role_update before update on blog.posts for each row execute function blog_private.enforce_post_update();

grant usage on schema blog to anon,authenticated;
grant select(id,display_name,slug,bio,avatar_url,website,created_at,updated_at) on blog.profiles to anon;
grant select on blog.categories,blog.tags,blog.posts,blog.post_categories,blog.post_tags,blog.media,blog.menus,blog.menu_items,blog.announcements,blog.homepage_sections,blog.site_settings to anon;
grant select,insert,update on blog.profiles to authenticated;
grant select,insert,update,delete on blog.posts,blog.categories,blog.tags,blog.post_categories,blog.post_tags,blog.media,blog.menus,blog.menu_items,blog.announcements,blog.homepage_sections to authenticated;
grant select,insert on blog.post_revisions,blog.audit_logs to authenticated;
grant select,insert,update on blog.site_settings to authenticated;

create policy blog_profiles_public_select on blog.profiles for select to anon using(is_active=true);
create policy blog_profiles_authenticated_select on blog.profiles for select to authenticated using(is_active=true or id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_profiles_admin_insert on blog.profiles for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_profiles_self_or_admin_update on blog.profiles for update to authenticated using(id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role)) with check(id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));

create policy blog_categories_public_select on blog.categories for select to anon using(is_active=true);
create policy blog_categories_authenticated_select on blog.categories for select to authenticated using(is_active=true or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));
create policy blog_categories_staff_insert on blog.categories for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));
create policy blog_categories_staff_update on blog.categories for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));
create policy blog_categories_staff_delete on blog.categories for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));

create policy blog_tags_public_select on blog.tags for select to anon,authenticated using(true);
create policy blog_tags_staff_insert on blog.tags for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));
create policy blog_tags_staff_update on blog.tags for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));
create policy blog_tags_staff_delete on blog.tags for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));

create policy blog_posts_public_select on blog.posts for select to anon using(status='published'::blog.post_status and deleted_at is null and published_at is not null and published_at<=now());
create policy blog_posts_authenticated_select on blog.posts for select to authenticated using((status='published'::blog.post_status and deleted_at is null and published_at is not null and published_at<=now()) or author_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role));
create policy blog_posts_creator_insert on blog.posts for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'author'::blog.app_role) and (blog_private.current_app_role()<>'author'::blog.app_role or author_id=(select auth.uid())) and (blog_private.current_app_role()<>'author'::blog.app_role or status in ('draft'::blog.post_status,'review'::blog.post_status)));
create policy blog_posts_staff_update on blog.posts for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));
create policy blog_posts_author_update on blog.posts for update to authenticated using(blog_private.current_app_role()='author'::blog.app_role and author_id=(select auth.uid()) and status in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status)) with check(blog_private.current_app_role()='author'::blog.app_role and author_id=(select auth.uid()) and status in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status));
create policy blog_posts_reviewer_update on blog.posts for update to authenticated using(blog_private.current_app_role()='reviewer'::blog.app_role and status='review'::blog.post_status) with check(blog_private.current_app_role()='reviewer'::blog.app_role and status in ('review'::blog.post_status,'draft'::blog.post_status));
create policy blog_posts_admin_delete on blog.posts for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));

create policy blog_post_categories_public_select on blog.post_categories for select to anon using(exists(select 1 from blog.posts p where p.id=post_id and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()));
create policy blog_post_categories_authenticated_select on blog.post_categories for select to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and ((p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()) or p.author_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role))));
create policy blog_post_categories_insert on blog.post_categories for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or exists(select 1 from blog.posts p where p.id=post_id and p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status));
create policy blog_post_categories_update on blog.post_categories for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or exists(select 1 from blog.posts p where p.id=post_id and p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or exists(select 1 from blog.posts p where p.id=post_id and p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status));
create policy blog_post_categories_delete on blog.post_categories for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or exists(select 1 from blog.posts p where p.id=post_id and p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status));

create policy blog_post_tags_public_select on blog.post_tags for select to anon using(exists(select 1 from blog.posts p where p.id=post_id and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()));
create policy blog_post_tags_authenticated_select on blog.post_tags for select to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and ((p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()) or p.author_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role))));
create policy blog_post_tags_insert on blog.post_tags for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or exists(select 1 from blog.posts p where p.id=post_id and p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status));
create policy blog_post_tags_delete on blog.post_tags for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or exists(select 1 from blog.posts p where p.id=post_id and p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status));

create policy blog_revisions_select on blog.post_revisions for select to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and (p.author_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role))));
create policy blog_revisions_insert on blog.post_revisions for insert to authenticated with check(editor_id=(select auth.uid()) and exists(select 1 from blog.posts p where p.id=post_id and (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or (blog_private.current_app_role()='author'::blog.app_role and p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status) or (blog_private.current_app_role()='reviewer'::blog.app_role and p.status='review'::blog.post_status))));

create policy blog_media_public_select on blog.media for select to anon using(bucket='blog-avatars' or exists(select 1 from blog.posts p where p.cover_image_id=id and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()));
create policy blog_media_authenticated_select on blog.media for select to authenticated using(owner_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role) or bucket='blog-avatars' or exists(select 1 from blog.posts p where p.cover_image_id=id and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()));
create policy blog_media_insert on blog.media for insert to authenticated with check(owner_id=(select auth.uid()) and blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'author'::blog.app_role));
create policy blog_media_update on blog.media for update to authenticated using(owner_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)) with check(owner_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));
create policy blog_media_delete on blog.media for delete to authenticated using(owner_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role));

create policy blog_menus_public_select on blog.menus for select to anon,authenticated using(true);
create policy blog_menus_admin_insert on blog.menus for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_menus_admin_update on blog.menus for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_menus_admin_delete on blog.menus for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_menu_items_public_select on blog.menu_items for select to anon using(is_visible=true);
create policy blog_menu_items_authenticated_select on blog.menu_items for select to authenticated using(is_visible=true or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_menu_items_admin_insert on blog.menu_items for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_menu_items_admin_update on blog.menu_items for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_menu_items_admin_delete on blog.menu_items for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));

create policy blog_announcements_public_select on blog.announcements for select to anon using(is_active=true and (start_at is null or start_at<=now()) and (end_at is null or end_at>now()));
create policy blog_announcements_authenticated_select on blog.announcements for select to authenticated using((is_active=true and (start_at is null or start_at<=now()) and (end_at is null or end_at>now())) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_announcements_admin_insert on blog.announcements for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_announcements_admin_update on blog.announcements for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_announcements_admin_delete on blog.announcements for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));

create policy blog_homepage_public_select on blog.homepage_sections for select to anon using(is_enabled=true);
create policy blog_homepage_authenticated_select on blog.homepage_sections for select to authenticated using(is_enabled=true or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_homepage_admin_insert on blog.homepage_sections for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_homepage_admin_update on blog.homepage_sections for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_homepage_admin_delete on blog.homepage_sections for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));

create policy blog_site_settings_public_select on blog.site_settings for select to anon,authenticated using(true);
create policy blog_site_settings_admin_insert on blog.site_settings for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_site_settings_admin_update on blog.site_settings for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));

create policy blog_audit_logs_admin_select on blog.audit_logs for select to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_audit_logs_staff_insert on blog.audit_logs for insert to authenticated with check(user_id=(select auth.uid()) and blog_private.current_app_role() is not null);
