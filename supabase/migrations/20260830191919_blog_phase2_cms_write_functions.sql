-- Atomic CMS write; SECURITY INVOKER keeps grants and RLS authoritative.
create or replace function blog.cms_save_post(
 p_id uuid,p_title text,p_slug text,p_excerpt text,p_type blog.content_type,p_status blog.post_status,
 p_content_json jsonb,p_content_html text,p_content_text text,p_cover_image_id uuid,p_external_url text,
 p_featured boolean,p_scheduled_at timestamptz,p_category_ids uuid[],p_primary_category_id uuid,
 p_tag_ids uuid[],p_revision_source blog.revision_source
) returns uuid language plpgsql security invoker set search_path=''
as $$
declare actor uuid := (select auth.uid()); post_id uuid := p_id; old_status blog.post_status; audit_action text;
begin
 if actor is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(p_content_json)<>'object' then raise exception 'content_json must be an object'; end if;
 if p_primary_category_id is not null and array_position(coalesce(p_category_ids,array[]::uuid[]),p_primary_category_id) is null then raise exception 'Primary category must be included in category ids'; end if;
 if post_id is null then
  insert into blog.posts(author_id,type,status,title,slug,excerpt,content_json,content_html,content_text,cover_image_id,external_url,featured,published_at,scheduled_at,archived_at)
  values(actor,p_type,p_status,trim(p_title),trim(p_slug),coalesce(p_excerpt,''),p_content_json,coalesce(p_content_html,''),coalesce(p_content_text,''),p_cover_image_id,p_external_url,coalesce(p_featured,false),case when p_status='published'::blog.post_status then now() else null end,case when p_status='scheduled'::blog.post_status then p_scheduled_at else null end,case when p_status='archived'::blog.post_status then now() else null end)
  returning id into post_id;
  audit_action:=case when p_status='published'::blog.post_status then 'publish_post' else 'create_post' end;
 else
  select status into old_status from blog.posts where id=post_id for update;
  if old_status is null then raise exception 'Post not found'; end if;
  update blog.posts set type=p_type,status=p_status,title=trim(p_title),slug=trim(p_slug),excerpt=coalesce(p_excerpt,''),content_json=p_content_json,content_html=coalesce(p_content_html,''),content_text=coalesce(p_content_text,''),cover_image_id=p_cover_image_id,external_url=p_external_url,featured=coalesce(p_featured,false),
   published_at=case when p_status='published'::blog.post_status then coalesce(published_at,now()) when old_status='published'::blog.post_status and p_status<>'published'::blog.post_status then null else published_at end,
   scheduled_at=case when p_status='scheduled'::blog.post_status then p_scheduled_at else null end,
   archived_at=case when p_status='archived'::blog.post_status then coalesce(archived_at,now()) else null end
  where id=post_id;
  audit_action:=case when old_status<>'published'::blog.post_status and p_status='published'::blog.post_status then 'publish_post' when old_status<>'archived'::blog.post_status and p_status='archived'::blog.post_status then 'archive_post' when old_status='archived'::blog.post_status and p_status<>'archived'::blog.post_status then 'restore_post' else 'update_post' end;
 end if;
 delete from blog.post_categories where post_id=blog.cms_save_post.post_id;
 insert into blog.post_categories(post_id,category_id,is_primary) select blog.cms_save_post.post_id,category_id,category_id=p_primary_category_id from unnest(coalesce(p_category_ids,array[]::uuid[])) as category_id;
 delete from blog.post_tags where post_id=blog.cms_save_post.post_id;
 insert into blog.post_tags(post_id,tag_id) select blog.cms_save_post.post_id,tag_id from unnest(coalesce(p_tag_ids,array[]::uuid[])) as tag_id;
 if p_revision_source<>'autosave'::blog.revision_source or not exists(select 1 from blog.post_revisions where post_id=blog.cms_save_post.post_id and source='autosave'::blog.revision_source and created_at>now()-interval '5 minutes') then
  insert into blog.post_revisions(post_id,editor_id,source,title,excerpt,content_json,content_html) values(blog.cms_save_post.post_id,actor,p_revision_source,trim(p_title),coalesce(p_excerpt,''),p_content_json,coalesce(p_content_html,''));
 end if;
 insert into blog.audit_logs(user_id,action,entity_type,entity_id,metadata) values(actor,audit_action,'post',post_id,jsonb_build_object('status',p_status::text,'revision_source',p_revision_source::text));
 return post_id;
end; $$;
revoke all on function blog.cms_save_post(uuid,text,text,text,blog.content_type,blog.post_status,jsonb,text,text,uuid,text,boolean,timestamptz,uuid[],uuid,uuid[],blog.revision_source) from public;
grant execute on function blog.cms_save_post(uuid,text,text,text,blog.content_type,blog.post_status,jsonb,text,text,uuid,text,boolean,timestamptz,uuid[],uuid,uuid[],blog.revision_source) to authenticated;
