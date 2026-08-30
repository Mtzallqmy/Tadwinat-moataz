-- Phase 2 blog schema isolated from the pre-existing public application.
create schema if not exists blog;
create schema if not exists blog_private;
revoke all on schema blog_private from public;

create type blog.app_role as enum ('owner','admin','editor','author','reviewer');
create type blog.content_type as enum ('article','note','diary','story','link','page');
create type blog.post_status as enum ('draft','review','scheduled','published','archived');
create type blog.revision_source as enum ('manual','autosave','publish');
create type blog.menu_location as enum ('header','mobile','footer');
create type blog.menu_item_type as enum ('page','category','external','custom');

create table blog.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  slug text not null unique check (char_length(trim(slug)) between 1 and 160 and slug !~ '\s'),
  bio text,
  avatar_url text,
  website text,
  role blog.app_role not null default 'author',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table blog.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (char_length(trim(slug)) between 1 and 160 and slug !~ '\s'),
  description text not null default '',
  icon text not null default 'folder',
  color text,
  parent_id uuid references blog.categories(id) on delete restrict,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_not_self_parent check (parent_id is null or parent_id <> id)
);

create table blog.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (char_length(trim(slug)) between 1 and 160 and slug !~ '\s'),
  description text,
  created_at timestamptz not null default now()
);

create table blog.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references blog.profiles(id) on delete restrict,
  bucket text not null check (bucket in ('blog-media','blog-avatars')),
  path text not null check (char_length(trim(path)) > 0),
  file_name text not null check (char_length(trim(file_name)) > 0),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif','image/gif')),
  size bigint not null check (size > 0 and size <= 10485760),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text not null default '',
  caption text,
  credit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bucket,path)
);

create table blog.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references blog.profiles(id) on delete restrict,
  type blog.content_type not null default 'article',
  status blog.post_status not null default 'draft',
  title text not null check (char_length(trim(title)) between 1 and 240),
  slug text not null unique check (char_length(trim(slug)) between 1 and 220 and slug !~ '\s'),
  excerpt text not null default '',
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  content_html text not null default '',
  content_text text not null default '',
  cover_image_id uuid references blog.media(id) on delete set null,
  external_url text,
  featured boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_content_json_object check (jsonb_typeof(content_json)='object'),
  constraint posts_link_requires_url check (type <> 'link' or external_url is not null),
  constraint posts_published_requires_date check (status <> 'published' or published_at is not null),
  constraint posts_scheduled_requires_date check (status <> 'scheduled' or scheduled_at is not null)
);

create table blog.post_categories (
  post_id uuid not null references blog.posts(id) on delete cascade,
  category_id uuid not null references blog.categories(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(post_id,category_id)
);
create unique index blog_post_categories_one_primary_idx on blog.post_categories(post_id) where is_primary;

create table blog.post_tags (
  post_id uuid not null references blog.posts(id) on delete cascade,
  tag_id uuid not null references blog.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,tag_id)
);

create table blog.post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog.posts(id) on delete cascade,
  editor_id uuid not null references blog.profiles(id) on delete restrict,
  source blog.revision_source not null default 'manual',
  title text not null,
  excerpt text not null default '',
  content_json jsonb not null,
  content_html text not null default '',
  created_at timestamptz not null default now(),
  constraint revisions_content_json_object check (jsonb_typeof(content_json)='object')
);

create table blog.menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location blog.menu_location not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table blog.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references blog.menus(id) on delete cascade,
  parent_id uuid references blog.menu_items(id) on delete cascade,
  type blog.menu_item_type not null default 'custom',
  label text not null check (char_length(trim(label)) between 1 and 120),
  url text,
  category_id uuid references blog.categories(id) on delete set null,
  post_id uuid references blog.posts(id) on delete set null,
  sort_order integer not null default 0,
  target text not null default '_self' check (target in ('_self','_blank')),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_not_self_parent check (parent_id is null or parent_id <> id),
  constraint menu_items_category_target check (type <> 'category' or category_id is not null),
  constraint menu_items_page_target check (type <> 'page' or post_id is not null),
  constraint menu_items_url_target check (type not in ('external','custom') or url is not null)
);

create table blog.announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(trim(text)) between 1 and 280),
  url text,
  icon text,
  is_active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  priority integer not null default 0,
  dismissible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_date_order check (end_at is null or start_at is null or end_at > start_at)
);

create table blog.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique check (section_key in ('featured','latest_posts','content_types','categories','quick_notes','medical','culture','thought','diaries','links','popular','newsletter')),
  title text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  item_count integer not null default 3 check (item_count between 1 and 24),
  category_id uuid references blog.categories(id) on delete set null,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table blog.site_settings (
  id boolean primary key default true check(id),
  site_name text not null default 'معتز العلقمي',
  site_description text not null default 'منصة شخصية للنشر والمعرفة والتدوين',
  logo text,
  favicon text,
  author_name text not null default 'معتز العلقمي',
  author_bio text not null default '',
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links)='object'),
  contact_email text,
  default_theme text not null default 'system' check (default_theme in ('light','dark','system')),
  updated_at timestamptz not null default now()
);

create table blog.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references blog.profiles(id) on delete set null,
  action text not null check (char_length(trim(action)) between 1 and 80),
  entity_type text not null check (char_length(trim(entity_type)) between 1 and 80),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now()
);

create index blog_posts_status_idx on blog.posts(status);
create index blog_posts_type_idx on blog.posts(type);
create index blog_posts_published_at_idx on blog.posts(published_at desc);
create index blog_posts_author_id_idx on blog.posts(author_id);
create index blog_posts_updated_at_idx on blog.posts(updated_at desc);
create index blog_posts_public_feed_idx on blog.posts(published_at desc) where status='published' and deleted_at is null;
create index blog_categories_parent_sort_idx on blog.categories(parent_id,sort_order);
create index blog_post_categories_category_idx on blog.post_categories(category_id,post_id);
create index blog_post_tags_tag_idx on blog.post_tags(tag_id,post_id);
create index blog_revisions_post_created_idx on blog.post_revisions(post_id,created_at desc);
create index blog_media_owner_created_idx on blog.media(owner_id,created_at desc);
create index blog_media_bucket_created_idx on blog.media(bucket,created_at desc);
create index blog_menu_items_menu_sort_idx on blog.menu_items(menu_id,parent_id,sort_order);
create index blog_announcements_active_priority_idx on blog.announcements(is_active,priority desc);
create index blog_homepage_sections_sort_idx on blog.homepage_sections(sort_order);
create index blog_audit_logs_entity_idx on blog.audit_logs(entity_type,entity_id,created_at desc);
create index blog_audit_logs_user_idx on blog.audit_logs(user_id,created_at desc);

create or replace function blog_private.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger blog_profiles_set_updated_at before update on blog.profiles for each row execute function blog_private.set_updated_at();
create trigger blog_categories_set_updated_at before update on blog.categories for each row execute function blog_private.set_updated_at();
create trigger blog_media_set_updated_at before update on blog.media for each row execute function blog_private.set_updated_at();
create trigger blog_posts_set_updated_at before update on blog.posts for each row execute function blog_private.set_updated_at();
create trigger blog_menus_set_updated_at before update on blog.menus for each row execute function blog_private.set_updated_at();
create trigger blog_menu_items_set_updated_at before update on blog.menu_items for each row execute function blog_private.set_updated_at();
create trigger blog_announcements_set_updated_at before update on blog.announcements for each row execute function blog_private.set_updated_at();
create trigger blog_homepage_sections_set_updated_at before update on blog.homepage_sections for each row execute function blog_private.set_updated_at();
create trigger blog_site_settings_set_updated_at before update on blog.site_settings for each row execute function blog_private.set_updated_at();

create or replace function blog_private.enforce_menu_item_depth() returns trigger language plpgsql set search_path='' as $$
declare parent_menu uuid; grandparent_id uuid;
begin
  if new.parent_id is null then return new; end if;
  select menu_id,parent_id into parent_menu,grandparent_id from blog.menu_items where id=new.parent_id;
  if parent_menu is null or parent_menu<>new.menu_id then raise exception 'Menu item parent must belong to same menu'; end if;
  if grandparent_id is not null then raise exception 'Menu nesting is limited to two levels'; end if;
  return new;
end; $$;
create trigger blog_menu_items_enforce_depth before insert or update of parent_id,menu_id on blog.menu_items for each row execute function blog_private.enforce_menu_item_depth();

alter table blog.profiles enable row level security;
alter table blog.categories enable row level security;
alter table blog.tags enable row level security;
alter table blog.media enable row level security;
alter table blog.posts enable row level security;
alter table blog.post_categories enable row level security;
alter table blog.post_tags enable row level security;
alter table blog.post_revisions enable row level security;
alter table blog.menus enable row level security;
alter table blog.menu_items enable row level security;
alter table blog.announcements enable row level security;
alter table blog.homepage_sections enable row level security;
alter table blog.site_settings enable row level security;
alter table blog.audit_logs enable row level security;

revoke all on schema blog from public,anon,authenticated;
revoke all on all tables in schema blog from public,anon,authenticated;
revoke all on all sequences in schema blog from public,anon,authenticated;
revoke all on all functions in schema blog from public,anon,authenticated;
revoke all on schema blog_private from public,anon,authenticated;
revoke all on all functions in schema blog_private from public,anon,authenticated;
