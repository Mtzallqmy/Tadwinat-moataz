alter table blog.newsletter_deliveries
  add column if not exists attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  add column if not exists next_retry_at timestamptz;
create index if not exists blog_newsletter_deliveries_retry_idx
  on blog.newsletter_deliveries(status,next_retry_at)
  where status='failed';
