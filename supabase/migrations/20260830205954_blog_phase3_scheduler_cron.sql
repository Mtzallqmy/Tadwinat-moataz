-- One centralized scheduler publishes all due posts; no per-post cron jobs.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
select cron.unschedule(jobid) from cron.job where jobname='blog-publish-scheduled';
select cron.schedule('blog-publish-scheduled','* * * * *','select * from blog.publish_due_posts(50);');
