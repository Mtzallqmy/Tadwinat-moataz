alter table blog.redirects
  add constraint redirects_source_trimmed_check check (source_path = btrim(source_path)),
  add constraint redirects_destination_internal_check check (
    destination_url = btrim(destination_url)
    and left(destination_url, 1) = '/'
    and left(destination_url, 2) <> '//'
  ),
  add constraint redirects_not_self_check check (source_path <> destination_url);
