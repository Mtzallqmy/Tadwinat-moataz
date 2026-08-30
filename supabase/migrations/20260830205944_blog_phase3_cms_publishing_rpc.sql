-- Phase 3 atomic CMS write with publishing, SEO/GEO, references and FAQ.
create or replace function blog.cms_save_post_v3(
 p_id uuid,p_title text,p_slug text,p_excerpt text,p_type blog.content_type,p_status blog.post_status,
 p_content_json jsonb,p_content_html text,p_content_text text,p_cover_image_id uuid,p_external_url text,
 p_featured boolean,p_scheduled_at timestamptz,p_category_ids uuid[],p_primary_category_id uuid,
 p_tag_ids uuid[],p_revision_source blog.revision_source,p_phase3 jsonb
) returns uuid language plpgsql security invoker set search_path=''
as $$
declare
 actor uuid:=(select auth.uid()); saved_post_id uuid:=p_id; old_status blog.post_status; old_slug text; audit_action text;
 phase3 jsonb:=coalesce(p_phase3,'{}'::jsonb); points jsonb; refs jsonb; faqs jsonb;
 v_summary text; v_seo_title text; v_seo_description text; v_canonical_url text; v_og_title text; v_og_description text;
 v_twitter_title text; v_twitter_description text; v_focus_keyword text; v_og_image_id uuid; v_twitter_image_id uuid;
 v_robots_index boolean; v_robots_follow boolean; v_medical_reviewed boolean; ref_item jsonb; faq_item jsonb; pos bigint;
begin
 if actor is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(p_content_json)<>'object' then raise exception 'content_json must be an object'; end if;
 if jsonb_typeof(phase3)<>'object' then raise exception 'phase3 payload must be an object'; end if;
 if p_primary_category_id is not null and array_position(coalesce(p_category_ids,array[]::uuid[]),p_primary_category_id) is null then raise exception 'Primary category must be included in category ids'; end if;
 if p_status='scheduled'::blog.post_status and (p_scheduled_at is null or p_scheduled_at<=now()) then raise exception 'scheduled_at must be in the future'; end if;
 points:=coalesce(phase3->'key_points','[]'::jsonb); refs:=coalesce(phase3->'references','[]'::jsonb); faqs:=coalesce(phase3->'faqs','[]'::jsonb);
 if jsonb_typeof(points)<>'array' or jsonb_typeof(refs)<>'array' or jsonb_typeof(faqs)<>'array' then raise exception 'key_points, references and faqs must be arrays'; end if;
 v_summary:=nullif(trim(phase3->>'summary'),'');
 v_seo_title:=nullif(trim(phase3->>'seo_title'),''); v_seo_description:=nullif(trim(phase3->>'seo_description'),''); v_canonical_url:=nullif(trim(phase3->>'canonical_url'),'');
 v_robots_index:=coalesce((phase3->>'robots_index')::boolean,true); v_robots_follow:=coalesce((phase3->>'robots_follow')::boolean,true);
 v_og_title:=nullif(trim(phase3->>'og_title'),''); v_og_description:=nullif(trim(phase3->>'og_description'),'');
 v_twitter_title:=nullif(trim(phase3->>'twitter_title'),''); v_twitter_description:=nullif(trim(phase3->>'twitter_description'),''); v_focus_keyword:=nullif(trim(phase3->>'focus_keyword'),'');
 v_medical_reviewed:=coalesce((phase3->>'medical_reviewed')::boolean,false);
 v_og_image_id:=nullif(phase3->>'og_image_id','')::uuid; v_twitter_image_id:=nullif(phase3->>'twitter_image_id','')::uuid;

 if saved_post_id is null then
  insert into blog.posts(author_id,type,status,title,slug,excerpt,content_json,content_html,content_text,cover_image_id,external_url,featured,published_at,scheduled_at,archived_at,summary,key_points,seo_title,seo_description,canonical_url,robots_index,robots_follow,og_title,og_description,og_image_id,twitter_title,twitter_description,twitter_image_id,focus_keyword,medical_reviewed,last_publish_error,publish_attempts,last_publish_attempt_at)
  values(actor,p_type,p_status,trim(p_title),trim(p_slug),coalesce(p_excerpt,''),p_content_json,coalesce(p_content_html,''),coalesce(p_content_text,''),p_cover_image_id,p_external_url,coalesce(p_featured,false),case when p_status='published'::blog.post_status then now() else null end,case when p_status='scheduled'::blog.post_status then p_scheduled_at else null end,case when p_status='archived'::blog.post_status then now() else null end,v_summary,points,v_seo_title,v_seo_description,v_canonical_url,v_robots_index,v_robots_follow,v_og_title,v_og_description,v_og_image_id,v_twitter_title,v_twitter_description,v_twitter_image_id,v_focus_keyword,v_medical_reviewed,null,0,null)
  returning id into saved_post_id;
  audit_action:=case when p_status='published'::blog.post_status then 'publish_post' when p_status='scheduled'::blog.post_status then 'scheduled_post' when p_status='archived'::blog.post_status then 'archive_post' else 'create_post' end;
 else
  select status,slug into old_status,old_slug from blog.posts where id=saved_post_id for update;
  if old_status is null then raise exception 'Post not found'; end if;
  update blog.posts set type=p_type,status=p_status,title=trim(p_title),slug=trim(p_slug),excerpt=coalesce(p_excerpt,''),content_json=p_content_json,content_html=coalesce(p_content_html,''),content_text=coalesce(p_content_text,''),cover_image_id=p_cover_image_id,external_url=p_external_url,featured=coalesce(p_featured,false),
    published_at=case when p_status='published'::blog.post_status then case when old_status='published'::blog.post_status then published_at else coalesce(published_at,now()) end when old_status='published'::blog.post_status then null else published_at end,
    scheduled_at=case when p_status='scheduled'::blog.post_status then p_scheduled_at else null end,
    archived_at=case when p_status='archived'::blog.post_status then coalesce(archived_at,now()) else null end,
    summary=v_summary,key_points=points,seo_title=v_seo_title,seo_description=v_seo_description,canonical_url=v_canonical_url,robots_index=v_robots_index,robots_follow=v_robots_follow,og_title=v_og_title,og_description=v_og_description,og_image_id=v_og_image_id,twitter_title=v_twitter_title,twitter_description=v_twitter_description,twitter_image_id=v_twitter_image_id,focus_keyword=v_focus_keyword,medical_reviewed=v_medical_reviewed,
    last_publish_error=case when p_status in ('scheduled'::blog.post_status,'published'::blog.post_status) then null else last_publish_error end,
    publish_attempts=case when p_status='scheduled'::blog.post_status then 0 else publish_attempts end,
    last_publish_attempt_at=case when p_status='scheduled'::blog.post_status then null else last_publish_attempt_at end
  where id=saved_post_id;
  audit_action:=case
    when old_status<>'published'::blog.post_status and p_status='published'::blog.post_status then 'publish_post'
    when old_status='published'::blog.post_status and p_status='published'::blog.post_status then 'update_published_post'
    when old_status='published'::blog.post_status and p_status<>'published'::blog.post_status then 'unpublish_post'
    when p_status='scheduled'::blog.post_status and old_status<>'scheduled'::blog.post_status then 'scheduled_post'
    when old_status<>'archived'::blog.post_status and p_status='archived'::blog.post_status then 'archive_post'
    else 'update_post' end;
 end if;

 delete from blog.post_categories where post_id=saved_post_id;
 insert into blog.post_categories(post_id,category_id,is_primary) select saved_post_id,category_id,category_id=p_primary_category_id from unnest(coalesce(p_category_ids,array[]::uuid[])) as category_id;
 delete from blog.post_tags where post_id=saved_post_id;
 insert into blog.post_tags(post_id,tag_id) select saved_post_id,tag_id from unnest(coalesce(p_tag_ids,array[]::uuid[])) as tag_id;
 delete from blog.post_references where post_id=saved_post_id;
 for ref_item,pos in select value,ordinality from jsonb_array_elements(refs) with ordinality loop
   if nullif(trim(ref_item->>'title'),'') is not null then
     insert into blog.post_references(post_id,title,url,publisher,author,published_date,accessed_at,sort_order)
     values(saved_post_id,trim(ref_item->>'title'),nullif(trim(ref_item->>'url'),''),nullif(trim(ref_item->>'publisher'),''),nullif(trim(ref_item->>'author'),''),nullif(ref_item->>'published_date','')::date,nullif(ref_item->>'accessed_at','')::date,coalesce((ref_item->>'sort_order')::integer,pos::integer-1));
   end if;
 end loop;
 delete from blog.post_faqs where post_id=saved_post_id;
 for faq_item,pos in select value,ordinality from jsonb_array_elements(faqs) with ordinality loop
   if nullif(trim(faq_item->>'question'),'') is not null and nullif(trim(faq_item->>'answer'),'') is not null then
     insert into blog.post_faqs(post_id,question,answer,sort_order) values(saved_post_id,trim(faq_item->>'question'),trim(faq_item->>'answer'),coalesce((faq_item->>'sort_order')::integer,pos::integer-1));
   end if;
 end loop;
 if p_revision_source<>'autosave'::blog.revision_source or not exists(select 1 from blog.post_revisions where post_id=saved_post_id and source='autosave'::blog.revision_source and created_at>now()-interval '5 minutes') then
  insert into blog.post_revisions(post_id,editor_id,source,title,excerpt,content_json,content_html) values(saved_post_id,actor,p_revision_source,trim(p_title),coalesce(p_excerpt,''),p_content_json,coalesce(p_content_html,''));
 end if;
 insert into blog.audit_logs(user_id,action,entity_type,entity_id,metadata) values(actor,audit_action,'post',saved_post_id,jsonb_build_object('status',p_status::text,'revision_source',p_revision_source::text,'old_status',old_status::text,'old_slug',old_slug,'slug',p_slug));
 return saved_post_id;
end; $$;
revoke all on function blog.cms_save_post_v3(uuid,text,text,text,blog.content_type,blog.post_status,jsonb,text,text,uuid,text,boolean,timestamptz,uuid[],uuid,uuid[],blog.revision_source,jsonb) from public;
grant execute on function blog.cms_save_post_v3(uuid,text,text,text,blog.content_type,blog.post_status,jsonb,text,text,uuid,text,boolean,timestamptz,uuid[],uuid,uuid[],blog.revision_source,jsonb) to authenticated;
