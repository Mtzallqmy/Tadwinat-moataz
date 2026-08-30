alter table blog_private.rate_limits
  add column if not exists id bigint generated always as identity;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'blog_private.rate_limits'::regclass
      and contype = 'p'
  ) then
    alter table blog_private.rate_limits add constraint rate_limits_pkey primary key (id);
  end if;
end $$;

create index if not exists blog_newsletter_campaigns_created_by_idx
  on blog.newsletter_campaigns(created_by);

drop policy if exists blog_deliveries_staff_write on blog.newsletter_deliveries;
create policy blog_deliveries_admin_insert on blog.newsletter_deliveries
  for insert to authenticated
  with check (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_deliveries_admin_update on blog.newsletter_deliveries
  for update to authenticated
  using (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role))
  with check (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_deliveries_admin_delete on blog.newsletter_deliveries
  for delete to authenticated
  using (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));

drop policy if exists blog_channel_deliveries_admin_write on blog.telegram_channel_deliveries;
create policy blog_channel_deliveries_admin_insert on blog.telegram_channel_deliveries
  for insert to authenticated
  with check (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_channel_deliveries_admin_update on blog.telegram_channel_deliveries
  for update to authenticated
  using (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role))
  with check (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
create policy blog_channel_deliveries_admin_delete on blog.telegram_channel_deliveries
  for delete to authenticated
  using (blog_private.current_app_role() in ('owner'::blog.app_role,'admin'::blog.app_role));
