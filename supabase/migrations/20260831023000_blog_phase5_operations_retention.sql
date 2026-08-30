create table if not exists blog.system_job_runs (
  id bigint generated always as identity primary key,
  job_name text not null check (job_name in ('publish','integrations','maintenance')),
  status text not null check (status in ('succeeded','failed','partial')),
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);

create index if not exists blog_system_job_runs_job_finished_idx
  on blog.system_job_runs(job_name, finished_at desc);

alter table blog.system_job_runs enable row level security;
revoke all on blog.system_job_runs from anon, authenticated;
grant select on blog.system_job_runs to authenticated;
grant all on blog.system_job_runs to service_role;
grant usage, select on sequence blog.system_job_runs_id_seq to service_role;

drop policy if exists blog_system_job_runs_admin_select on blog.system_job_runs;
create policy blog_system_job_runs_admin_select on blog.system_job_runs
  for select to authenticated
  using (blog_private.current_app_role() in ('owner'::blog.app_role, 'admin'::blog.app_role));

create or replace function blog.run_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_sessions integer := 0;
  deleted_rate_limits integer := 0;
  redacted_telegram integer := 0;
  deleted_job_runs integer := 0;
begin
  delete from blog.telegram_sessions where expires_at < now();
  get diagnostics deleted_sessions = row_count;

  delete from blog_private.rate_limits where occurred_at < now() - interval '48 hours';
  get diagnostics deleted_rate_limits = row_count;

  update blog.telegram_actions
     set request_payload = '{}'::jsonb,
         result_payload = '{}'::jsonb
   where created_at < now() - interval '30 days'
     and (request_payload <> '{}'::jsonb or result_payload <> '{}'::jsonb);
  get diagnostics redacted_telegram = row_count;

  delete from blog.system_job_runs where finished_at < now() - interval '180 days';
  get diagnostics deleted_job_runs = row_count;

  return jsonb_build_object(
    'deleted_sessions', deleted_sessions,
    'deleted_rate_limits', deleted_rate_limits,
    'redacted_telegram_actions', redacted_telegram,
    'deleted_job_runs', deleted_job_runs
  );
end;
$$;

revoke all on function blog.run_maintenance() from public, anon, authenticated;
grant execute on function blog.run_maintenance() to service_role;
