create index if not exists blog_homepage_sections_category_id_idx on blog.homepage_sections(category_id);
create index if not exists blog_menu_items_category_id_idx on blog.menu_items(category_id);
create index if not exists blog_menu_items_parent_id_idx on blog.menu_items(parent_id);
create index if not exists blog_menu_items_post_id_idx on blog.menu_items(post_id);
create index if not exists blog_post_revisions_editor_id_idx on blog.post_revisions(editor_id);
create index if not exists blog_posts_cover_image_id_idx on blog.posts(cover_image_id);

drop policy if exists blog_posts_staff_update on blog.posts;
drop policy if exists blog_posts_author_update on blog.posts;
drop policy if exists blog_posts_reviewer_update on blog.posts;
create policy blog_posts_role_update on blog.posts for update to authenticated
using(
 blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)
 or (blog_private.current_app_role()='author'::blog.app_role and author_id=(select auth.uid()) and status in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status))
 or (blog_private.current_app_role()='reviewer'::blog.app_role and status='review'::blog.post_status)
)
with check(
 blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role)
 or (blog_private.current_app_role()='author'::blog.app_role and author_id=(select auth.uid()) and status in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status))
 or (blog_private.current_app_role()='reviewer'::blog.app_role and status in ('review'::blog.post_status,'draft'::blog.post_status))
);
