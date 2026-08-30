-- Phase 2 CMS base schema
-- Every public table is created with RLS enabled before privileges are granted.

create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum ('owner', 'admin', 'editor', 'author', 'reviewer');
create type public.content_type as enum ('article', 'note', 'diary', 'story', 'link', 'page');
create type public.post_status as enum ('draft', 'review', 'scheduled', 'published', 'archived');
create type public.revision_source as enum ('manual', 'autosave', 'publish');
create type public.menu_location as enum ('header', 'mobile', 'footer');
create type public.menu_item_type as enum ('page', 'category', 'external', 'custom');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  slug text not null unique check (char_length(trim(slug)) between 1 and 160 and slug !~ '\s'),
  bio text,
  avatar_url text,
  website text,
  role public.app_role not null default 'author',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (char_length(trim(slug)) between 1 and 160 and slug !~ '\s'),
  description text not null default '',
  icon text not null default 'folder',
  color text,
  parent_id uuid references public.categories(id) on delete restrict,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_not_self_parent check (parent_id is null or parent_id <> id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (char_length(trim(slug)) between 1 and 160 and slug !~ '\s'),
  description text,
  created_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  bucket text not null check (bucket in ('media', 'avatars')),
  path text not null check (char_length(trim(path)) > 0),
  file_name text not null check (char_length(trim(file_name)) > 0),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif')),
  size bigint not null check (size > 0 and size <= 10485760),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text not null default '',
  caption text,
  credit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  type public.content_type not null default 'article',
  status public.post_status not null default 'draft',
  title text not null check (char_length(trim(title)) between 1 and 240),
  slug text not null unique check (char_length(trim(slug)) between 1 and 220 and slug !~ '\s'),
  excerpt text not null default '',
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  content_html text not null default '',
  content_text text not null default '',
  cover_image_id uuid references public.media(id) on delete set null,
  external_url text,
  featured boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_content_json_object check (jsonb_typeof(content_json) = 'object'),
  constraint posts_link_requires_url check (type <> 'link' or external_url is not null),
  constraint posts_published_requires_date check (status <> 'published' or published_at is not null),
  constraint posts_scheduled_requires_date check (status <> 'scheduled' or scheduled_at is not null)
);

create table public.post_categories (
  post_id uuid not null references public.posts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (post_id, category_id)
);

create unique index post_categories_one_primary_idx
  on public.post_categories (post_id)
  where is_primary;

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create table public.post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  editor_id uuid not null references public.profiles(id) on delete restrict,
  source public.revision_source not null default 'manual',
  title text not null,
  excerpt text not null default '',
  content_json jsonb not null,
  content_html text not null default '',
  created_at timestamptz not null default now(),
  constraint revisions_content_json_object check (jsonb_typeof(content_json) = 'object')
);

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location public.menu_location not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  parent_id uuid references public.menu_items(id) on delete cascade,
  type public.menu_item_type not null default 'custom',
  label text not null check (char_length(trim(label)) between 1 and 120),
  url text,
  category_id uuid references public.categories(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  sort_order integer not null default 0,
  target text not null default '_self' check (target in ('_self', '_blank')),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_not_self_parent check (parent_id is null or parent_id <> id),
  constraint menu_items_category_target check (type <> 'category' or category_id is not null),
  constraint menu_items_page_target check (type <> 'page' or post_id is not null),
  constraint menu_items_url_target check (type not in ('external', 'custom') or url is not null)
);

create table public.announcements (
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

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique check (section_key in (
    'featured', 'latest_posts', 'content_types', 'categories', 'quick_notes',
    'medical', 'culture', 'thought', 'diaries', 'links', 'popular', 'newsletter'
  )),
  title text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  item_count integer not null default 3 check (item_count between 1 and 24),
  category_id uuid references public.categories(id) on delete set null,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'معتز العلقمي',
  site_description text not null default 'منصة شخصية للنشر والمعرفة والتدوين',
  logo text,
  favicon text,
  author_name text not null default 'معتز العلقمي',
  author_bio text not null default '',
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  contact_email text,
  default_theme text not null default 'system' check (default_theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(trim(action)) between 1 and 80),
  entity_type text not null check (char_length(trim(entity_type)) between 1 and 80),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

-- Targeted indexes for feed queries, CMS filters, joins, and history.
create index posts_status_idx on public.posts(status);
create index posts_type_idx on public.posts(type);
create index posts_published_at_idx on public.posts(published_at desc);
create index posts_author_id_idx on public.posts(author_id);
create index posts_updated_at_idx on public.posts(updated_at desc);
create index posts_public_feed_idx on public.posts(published_at desc)
  where status = 'published' and deleted_at is null;
create index categories_parent_sort_idx on public.categories(parent_id, sort_order);
create index post_categories_category_idx on public.post_categories(category_id, post_id);
create index post_tags_tag_idx on public.post_tags(tag_id, post_id);
create index revisions_post_created_idx on public.post_revisions(post_id, created_at desc);
create index media_owner_created_idx on public.media(owner_id, created_at desc);
create index media_bucket_created_idx on public.media(bucket, created_at desc);
create index menu_items_menu_sort_idx on public.menu_items(menu_id, parent_id, sort_order);
create index announcements_active_priority_idx on public.announcements(is_active, priority desc);
create index homepage_sections_sort_idx on public.homepage_sections(sort_order);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index audit_logs_user_idx on public.audit_logs(user_id, created_at desc);

-- Centralized updated_at handling.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function private.set_updated_at();
create trigger media_set_updated_at before update on public.media
for each row execute function private.set_updated_at();
create trigger posts_set_updated_at before update on public.posts
for each row execute function private.set_updated_at();
create trigger menus_set_updated_at before update on public.menus
for each row execute function private.set_updated_at();
create trigger menu_items_set_updated_at before update on public.menu_items
for each row execute function private.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements
for each row execute function private.set_updated_at();
create trigger homepage_sections_set_updated_at before update on public.homepage_sections
for each row execute function private.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function private.set_updated_at();

-- Keep navigation to root + one child level and within the same menu.
create or replace function private.enforce_menu_item_depth()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_menu uuid;
  grandparent_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select menu_id, parent_id into parent_menu, grandparent_id
  from public.menu_items
  where id = new.parent_id;

  if parent_menu is null or parent_menu <> new.menu_id then
    raise exception 'Menu item parent must belong to the same menu';
  end if;

  if grandparent_id is not null then
    raise exception 'Menu nesting is limited to two levels';
  end if;

  return new;
end;
$$;

create trigger menu_items_enforce_depth
before insert or update of parent_id, menu_id on public.menu_items
for each row execute function private.enforce_menu_item_depth();

-- Lock every application table before any API grants are added.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.post_categories enable row level security;
alter table public.post_tags enable row level security;
alter table public.post_revisions enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.announcements enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
