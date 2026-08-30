-- Phase 3 publishing, SEO/GEO, references, redirects and PostgreSQL search.
create extension if not exists pg_trgm with schema extensions;

alter table blog.posts
  add column summary text,
  add column key_points jsonb not null default '[]'::jsonb,
  add column seo_title text,
  add column seo_description text,
  add column canonical_url text,
  add column robots_index boolean not null default true,
  add column robots_follow boolean not null default true,
  add column og_title text,
  add column og_description text,
  add column og_image_id uuid references blog.media(id) on delete set null,
  add column twitter_title text,
  add column twitter_description text,
  add column twitter_image_id uuid references blog.media(id) on delete set null,
  add column focus_keyword text,
  add column medical_reviewed boolean not null default false,
  add column last_publish_error text,
  add column publish_attempts integer not null default 0,
  add column last_publish_attempt_at timestamptz,
  add column search_document text not null default '',
  add column search_vector tsvector,
  add constraint blog_posts_key_points_array check (jsonb_typeof(key_points)='array'),
  add constraint blog_posts_publish_attempts_nonnegative check (publish_attempts>=0);

alter table blog.site_settings
  add column site_url text,
  add column default_og_image_id uuid references blog.media(id) on delete set null,
  add column twitter_handle text,
  add column default_indexing boolean not null default true,
  add column publisher_name text not null default 'معتز العلقمي',
  add column index_tag_pages boolean not null default false,
  add column timezone text not null default 'Asia/Aden',
  add column telegram_url text,
  add column x_url text,
  add column instagram_url text,
  add column linkedin_url text,
  add column youtube_url text;

create table blog.post_references (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog.posts(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 500),
  url text,
  publisher text,
  author text,
  published_date date,
  accessed_at date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table blog.post_faqs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog.posts(id) on delete cascade,
  question text not null check (char_length(trim(question)) between 1 and 500),
  answer text not null check (char_length(trim(answer)) between 1 and 5000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table blog.redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  destination_url text not null,
  status_code smallint not null default 301 check (status_code in (301,302,307,308)),
  is_active boolean not null default true,
  created_by uuid references blog.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_redirect_source_absolute_path check (left(source_path,1)='/')
);

create table blog.post_slug_history (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog.posts(id) on delete cascade,
  old_slug text not null,
  created_at timestamptz not null default now(),
  unique(post_id,old_slug),
  unique(old_slug)
);

create index blog_post_references_post_sort_idx on blog.post_references(post_id,sort_order,id);
create index blog_post_faqs_post_sort_idx on blog.post_faqs(post_id,sort_order,id);
create index blog_redirects_active_source_idx on blog.redirects(source_path) where is_active;
create index blog_post_slug_history_post_idx on blog.post_slug_history(post_id,created_at desc);
create index blog_posts_search_vector_idx on blog.posts using gin(search_vector);
create index blog_posts_search_document_trgm_idx on blog.posts using gin(search_document extensions.gin_trgm_ops);
create index blog_posts_scheduled_due_idx on blog.posts(scheduled_at,id) where status='scheduled'::blog.post_status and deleted_at is null;
create index blog_posts_noindex_idx on blog.posts(robots_index,status) where status='published'::blog.post_status and deleted_at is null;

create trigger blog_post_references_set_updated_at before update on blog.post_references for each row execute function blog_private.set_updated_at();
create trigger blog_post_faqs_set_updated_at before update on blog.post_faqs for each row execute function blog_private.set_updated_at();
create trigger blog_redirects_set_updated_at before update on blog.redirects for each row execute function blog_private.set_updated_at();

create or replace function blog_private.validate_site_timezone()
returns trigger language plpgsql set search_path=''
as $$ begin perform now() at time zone new.timezone; return new; exception when invalid_parameter_value then raise exception 'Invalid IANA timezone: %',new.timezone; end; $$;
revoke all on function blog_private.validate_site_timezone() from public,anon,authenticated;
grant execute on function blog_private.validate_site_timezone() to authenticated;
create trigger blog_site_settings_validate_timezone before insert or update of timezone on blog.site_settings for each row execute function blog_private.validate_site_timezone();

create or replace function blog.normalize_search_text(value text)
returns text language sql immutable parallel safe set search_path=''
as $$ select lower(regexp_replace(translate(coalesce(value,''),'أإآٱىؤئ','اااايوي'),'[ًٌٍَُِّْـٰ]','','g')) $$;
revoke all on function blog.normalize_search_text(text) from public;
grant execute on function blog.normalize_search_text(text) to anon,authenticated,service_role;

alter table blog.post_references enable row level security;
alter table blog.post_faqs enable row level security;
alter table blog.redirects enable row level security;
alter table blog.post_slug_history enable row level security;
revoke all on blog.post_references,blog.post_faqs,blog.redirects,blog.post_slug_history from public,anon,authenticated;
grant select on blog.post_references,blog.post_faqs to anon;
grant select,insert,update,delete on blog.post_references,blog.post_faqs,blog.redirects to authenticated;
grant select on blog.post_slug_history to authenticated;

create policy blog_post_references_public_select on blog.post_references for select to anon using(exists(select 1 from blog.posts p where p.id=post_id and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at is not null and p.published_at<=now()));
create policy blog_post_references_authenticated_select on blog.post_references for select to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and (p.author_id=(select auth.uid()) or (p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role))));
create policy blog_post_references_write on blog.post_references for all to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or (p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status)))) with check(exists(select 1 from blog.posts p where p.id=post_id and (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or (p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status))));
create policy blog_post_faqs_public_select on blog.post_faqs for select to anon using(exists(select 1 from blog.posts p where p.id=post_id and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at is not null and p.published_at<=now()));
create policy blog_post_faqs_authenticated_select on blog.post_faqs for select to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and (p.author_id=(select auth.uid()) or (p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role))));
create policy blog_post_faqs_write on blog.post_faqs for all to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or (p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status)))) with check(exists(select 1 from blog.posts p where p.id=post_id and (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) or (p.author_id=(select auth.uid()) and p.status<>'published'::blog.post_status))));
create policy blog_redirects_admin_select on blog.redirects for select to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_redirects_admin_insert on blog.redirects for insert to authenticated with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_redirects_admin_update on blog.redirects for update to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role)) with check(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_redirects_admin_delete on blog.redirects for delete to authenticated using(blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_slug_history_staff_select on blog.post_slug_history for select to authenticated using(exists(select 1 from blog.posts p where p.id=post_id and (p.author_id=(select auth.uid()) or blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role,'reviewer'::blog.app_role))));

create or replace function blog_private.refresh_post_search(p_post_id uuid)
returns void language plpgsql security definer set search_path=''
as $$ declare category_text text; tag_text text; source_title text; source_excerpt text; source_content text; normalized text; begin
  select p.title,p.excerpt,p.content_text into source_title,source_excerpt,source_content from blog.posts p where p.id=p_post_id;
  if not found then return; end if;
  select coalesce(string_agg(c.name,' '),'') into category_text from blog.post_categories pc join blog.categories c on c.id=pc.category_id where pc.post_id=p_post_id;
  select coalesce(string_agg(t.name,' '),'') into tag_text from blog.post_tags pt join blog.tags t on t.id=pt.tag_id where pt.post_id=p_post_id;
  normalized:=blog.normalize_search_text(concat_ws(' ',source_title,source_excerpt,source_content,category_text,tag_text));
  update blog.posts set search_document=normalized,search_vector=setweight(to_tsvector('simple',blog.normalize_search_text(source_title)),'A')||setweight(to_tsvector('simple',blog.normalize_search_text(source_excerpt)),'B')||setweight(to_tsvector('simple',blog.normalize_search_text(source_content)),'C')||setweight(to_tsvector('simple',blog.normalize_search_text(concat_ws(' ',category_text,tag_text))),'B') where id=p_post_id;
end; $$;
revoke all on function blog_private.refresh_post_search(uuid) from public,anon,authenticated;

create or replace function blog_private.refresh_post_search_trigger()
returns trigger language plpgsql security definer set search_path=''
as $$ begin if tg_op='DELETE' then perform blog_private.refresh_post_search(old.post_id); return old; else perform blog_private.refresh_post_search(new.post_id); return new; end if; end; $$;
revoke all on function blog_private.refresh_post_search_trigger() from public,anon,authenticated;
create trigger blog_post_categories_refresh_search after insert or update or delete on blog.post_categories for each row execute function blog_private.refresh_post_search_trigger();
create trigger blog_post_tags_refresh_search after insert or update or delete on blog.post_tags for each row execute function blog_private.refresh_post_search_trigger();

create or replace function blog_private.refresh_post_core_search_trigger()
returns trigger language plpgsql security definer set search_path=''
as $$ begin perform blog_private.refresh_post_search(new.id); return new; end; $$;
revoke all on function blog_private.refresh_post_core_search_trigger() from public,anon,authenticated;
create trigger blog_posts_refresh_search after insert or update of title,excerpt,content_text on blog.posts for each row execute function blog_private.refresh_post_core_search_trigger();

create or replace function blog_private.refresh_category_search_trigger()
returns trigger language plpgsql security definer set search_path=''
as $$ declare post_row record; begin if old.name is distinct from new.name then for post_row in select post_id from blog.post_categories where category_id=new.id loop perform blog_private.refresh_post_search(post_row.post_id); end loop; end if; return new; end; $$;
revoke all on function blog_private.refresh_category_search_trigger() from public,anon,authenticated;
create trigger blog_categories_refresh_search after update of name on blog.categories for each row execute function blog_private.refresh_category_search_trigger();

create or replace function blog_private.refresh_tag_search_trigger()
returns trigger language plpgsql security definer set search_path=''
as $$ declare post_row record; begin if old.name is distinct from new.name then for post_row in select post_id from blog.post_tags where tag_id=new.id loop perform blog_private.refresh_post_search(post_row.post_id); end loop; end if; return new; end; $$;
revoke all on function blog_private.refresh_tag_search_trigger() from public,anon,authenticated;
create trigger blog_tags_refresh_search after update of name on blog.tags for each row execute function blog_private.refresh_tag_search_trigger();

create or replace function blog_private.normalize_redirect_path(value text)
returns text language plpgsql immutable set search_path=''
as $$ declare result text:=trim(coalesce(value,'')); begin if result='' or left(result,1)<>'/' then raise exception 'Redirect source must be an absolute path'; end if; if position('://' in result)>0 then raise exception 'Redirect source cannot be an absolute URL'; end if; if result<>'/' then result:=regexp_replace(result,'/+$',''); end if; return result; end; $$;
revoke all on function blog_private.normalize_redirect_path(text) from public,anon,authenticated;

create or replace function blog_private.validate_redirect()
returns trigger language plpgsql set search_path=''
as $$ declare current_target text; next_target text; depth integer:=0; begin
  new.source_path:=blog_private.normalize_redirect_path(new.source_path); new.destination_url:=trim(new.destination_url);
  if new.destination_url='' then raise exception 'Redirect destination is required'; end if;
  if left(new.destination_url,1)='/' then new.destination_url:=blog_private.normalize_redirect_path(new.destination_url); end if;
  if new.destination_url=new.source_path then raise exception 'Redirect cannot point to itself'; end if;
  current_target:=new.destination_url;
  while left(current_target,1)='/' and depth<20 loop
    select r.destination_url into next_target from blog.redirects r where r.is_active=true and r.source_path=current_target and (tg_op='INSERT' or r.id<>new.id) limit 1;
    exit when not found;
    if next_target=new.source_path then raise exception 'Redirect loop detected'; end if;
    current_target:=next_target; depth:=depth+1;
  end loop;
  if depth>=20 then raise exception 'Redirect chain is too deep'; end if;
  if current_target<>new.destination_url then new.destination_url:=current_target; end if;
  return new;
end; $$;
revoke all on function blog_private.validate_redirect() from public,anon,authenticated;
grant execute on function blog_private.validate_redirect() to authenticated;
create trigger blog_redirects_validate before insert or update of source_path,destination_url,is_active on blog.redirects for each row execute function blog_private.validate_redirect();

create or replace function blog_private.sync_post_slug_redirects()
returns trigger language plpgsql security definer set search_path=''
as $$ declare new_path text; begin
  if old.slug is distinct from new.slug and old.published_at is not null then insert into blog.post_slug_history(post_id,old_slug) values(new.id,old.slug) on conflict(old_slug) do nothing; end if;
  if new.status='published'::blog.post_status and new.deleted_at is null then
    new_path:='/posts/'||new.slug;
    update blog.redirects set destination_url=new_path where is_active=true and destination_url in (select '/posts/'||h.old_slug from blog.post_slug_history h where h.post_id=new.id);
    insert into blog.redirects(source_path,destination_url,status_code,is_active,created_by) select '/posts/'||h.old_slug,new_path,301,true,(select auth.uid()) from blog.post_slug_history h where h.post_id=new.id on conflict(source_path) do update set destination_url=excluded.destination_url,status_code=301,is_active=true,updated_at=now();
  else update blog.redirects set is_active=false where source_path in (select '/posts/'||h.old_slug from blog.post_slug_history h where h.post_id=new.id); end if;
  return new;
end; $$;
revoke all on function blog_private.sync_post_slug_redirects() from public,anon,authenticated;
create trigger blog_posts_sync_slug_redirects after update of slug,status,deleted_at on blog.posts for each row execute function blog_private.sync_post_slug_redirects();

create or replace function blog.search_public_posts(p_query text default '',p_type blog.content_type default null,p_category_slug text default null,p_date_from timestamptz default null,p_date_to timestamptz default null,p_limit integer default 20,p_offset integer default 0)
returns table(id uuid,slug text,title text,excerpt text,type blog.content_type,published_at timestamptz,updated_at timestamptz,cover_image_id uuid,primary_category_slug text,primary_category_name text,rank real,total_count bigint)
language sql stable security invoker set search_path=''
as $$ with q as (select blog.normalize_search_text(trim(coalesce(p_query,''))) as value), ranked as (
  select p.id,p.slug,p.title,p.excerpt,p.type,p.published_at,p.updated_at,p.cover_image_id,c.slug as primary_category_slug,c.name as primary_category_name,case when q.value='' then 0::real else (ts_rank_cd(coalesce(p.search_vector,''::tsvector),websearch_to_tsquery('simple',q.value))+greatest(extensions.similarity(blog.normalize_search_text(p.title),q.value),extensions.similarity(p.search_document,q.value)*0.2))::real end as rank
  from blog.posts p cross join q left join blog.post_categories pc on pc.post_id=p.id and pc.is_primary=true left join blog.categories c on c.id=pc.category_id
  where p.status='published'::blog.post_status and p.deleted_at is null and p.published_at is not null and p.published_at<=now() and (p_type is null or p.type=p_type) and (p_category_slug is null or exists(select 1 from blog.post_categories fpc join blog.categories fc on fc.id=fpc.category_id where fpc.post_id=p.id and fc.slug=p_category_slug)) and (p_date_from is null or p.published_at>=p_date_from) and (p_date_to is null or p.published_at<p_date_to) and (q.value='' or coalesce(p.search_vector,''::tsvector)@@websearch_to_tsquery('simple',q.value) or extensions.similarity(blog.normalize_search_text(p.title),q.value)>0.25 or extensions.similarity(p.search_document,q.value)>0.12)
) select ranked.id,ranked.slug,ranked.title,ranked.excerpt,ranked.type,ranked.published_at,ranked.updated_at,ranked.cover_image_id,ranked.primary_category_slug,ranked.primary_category_name,ranked.rank,count(*) over() from ranked order by case when trim(coalesce(p_query,''))='' then 0 else rank end desc,published_at desc limit greatest(1,least(coalesce(p_limit,20),100)) offset greatest(coalesce(p_offset,0),0) $$;
revoke all on function blog.search_public_posts(text,blog.content_type,text,timestamptz,timestamptz,integer,integer) from public;
grant execute on function blog.search_public_posts(text,blog.content_type,text,timestamptz,timestamptz,integer,integer) to anon,authenticated;

create or replace function blog.related_public_posts(p_post_id uuid,p_limit integer default 3)
returns table(id uuid,slug text,title text,excerpt text,type blog.content_type,published_at timestamptz,cover_image_id uuid,score numeric)
language sql stable security invoker set search_path=''
as $$ with source as (select p.id,p.type,(select pc.category_id from blog.post_categories pc where pc.post_id=p.id and pc.is_primary=true limit 1) primary_category_id from blog.posts p where p.id=p_post_id and p.status='published'::blog.post_status and p.deleted_at is null), candidates as (
  select p.id,p.slug,p.title,p.excerpt,p.type,p.published_at,p.cover_image_id,(case when p.type=s.type then 1 else 0 end+case when s.primary_category_id is not null and exists(select 1 from blog.post_categories pc where pc.post_id=p.id and pc.category_id=s.primary_category_id) then 3 else 0 end+2*(select count(*) from blog.post_tags a where a.post_id=p.id and exists(select 1 from blog.post_tags b where b.post_id=p_post_id and b.tag_id=a.tag_id))+greatest(0,1-(extract(epoch from (now()-p.published_at))/31557600.0)))::numeric score from blog.posts p cross join source s where p.id<>p_post_id and p.status='published'::blog.post_status and p.deleted_at is null and p.published_at<=now()
) select * from candidates order by score desc,published_at desc limit greatest(1,least(coalesce(p_limit,3),12)) $$;
revoke all on function blog.related_public_posts(uuid,integer) from public;
grant execute on function blog.related_public_posts(uuid,integer) to anon,authenticated;

create or replace function blog.resolve_redirect(p_source_path text)
returns table(destination_url text,status_code smallint) language sql stable security definer set search_path=''
as $$ select r.destination_url,r.status_code from blog.redirects r where r.is_active=true and r.source_path=blog_private.normalize_redirect_path(p_source_path) limit 1 $$;
revoke all on function blog.resolve_redirect(text) from public;
grant execute on function blog.resolve_redirect(text) to anon,authenticated;

create or replace function blog_private.enforce_post_update()
returns trigger language plpgsql set search_path=''
as $$ declare actor uuid:=(select auth.uid()); actor_role blog.app_role:=blog_private.current_app_role(); begin
  if actor is null then if current_user in ('postgres','service_role') then return new; end if; raise exception 'Unauthorized post mutation'; end if;
  if actor_role is null then raise exception 'Unauthorized post mutation'; end if;
  if actor_role in ('owner'::blog.app_role,'admin'::blog.app_role,'editor'::blog.app_role) then return new; end if;
  if actor_role='author'::blog.app_role then if old.author_id<>actor or new.author_id<>actor then raise exception 'Authors can only edit their own posts'; end if; if old.status not in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status) or new.status not in ('draft'::blog.post_status,'review'::blog.post_status,'archived'::blog.post_status) then raise exception 'Authors cannot publish or edit published posts'; end if; return new; end if;
  if actor_role='reviewer'::blog.app_role then if old.status<>'review'::blog.post_status or new.status not in ('review'::blog.post_status,'draft'::blog.post_status) or new.author_id<>old.author_id then raise exception 'Reviewers may only review or return review-stage posts'; end if; return new; end if;
  raise exception 'Unauthorized post mutation';
end; $$;

create or replace function blog.publish_due_posts(p_limit integer default 50)
returns table(id uuid,slug text,published_at timestamptz) language plpgsql security definer set search_path=''
as $$ declare rec record; published_row record; begin
  for rec in select p.id from blog.posts p where p.status='scheduled'::blog.post_status and p.deleted_at is null and p.scheduled_at is not null and p.scheduled_at<=now() and p.publish_attempts<10 order by p.scheduled_at,p.id for update skip locked limit greatest(1,least(coalesce(p_limit,50),200)) loop
    begin
      update blog.posts p set status='published'::blog.post_status,published_at=coalesce(p.published_at,now()),scheduled_at=null,last_publish_error=null,publish_attempts=p.publish_attempts+1,last_publish_attempt_at=now() where p.id=rec.id and p.status='scheduled'::blog.post_status returning p.id,p.slug,p.published_at into published_row;
      if found then insert into blog.audit_logs(user_id,action,entity_type,entity_id,metadata) values(null,'publish_post','post',published_row.id,jsonb_build_object('source','scheduler')); id:=published_row.id; slug:=published_row.slug; published_at:=published_row.published_at; return next; end if;
    exception when others then
      update blog.posts p set publish_attempts=p.publish_attempts+1,last_publish_attempt_at=now(),last_publish_error=left(sqlerrm,1000) where p.id=rec.id;
      insert into blog.audit_logs(user_id,action,entity_type,entity_id,metadata) values(null,'scheduled_publish_failed','post',rec.id,jsonb_build_object('error',left(sqlerrm,1000)));
    end;
  end loop;
end; $$;
revoke all on function blog.publish_due_posts(integer) from public,anon,authenticated;
grant usage on schema blog to service_role;
grant execute on function blog.publish_due_posts(integer) to service_role;

select blog_private.refresh_post_search(id) from blog.posts;
