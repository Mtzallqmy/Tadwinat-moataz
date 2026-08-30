-- Optional development seed. No personal or credential data is included.

insert into public.categories (name, slug, description, icon, sort_order)
values
  ('طبي', 'medical', 'مقالات ومعلومات صحية وطبية عامة.', 'stethoscope', 10),
  ('صيدلاني', 'pharmacy', 'موضوعات حول الدواء والصيدلة.', 'pill', 20),
  ('ثقافي', 'culture', 'قراءات وملاحظات ثقافية.', 'library', 30),
  ('لغوي', 'language', 'اللغة والكتابة والكلمات.', 'languages', 40),
  ('ديني', 'religion', 'تأملات وموضوعات عامة.', 'moon-star', 50),
  ('فكري', 'thought', 'أسئلة وأفكار وقراءات.', 'brain', 60),
  ('تقني', 'technology', 'التقنية والأدوات الرقمية.', 'cpu', 70),
  ('شخصي', 'personal', 'تجارب وملاحظات شخصية.', 'user-round', 80),
  ('متنوع', 'misc', 'موضوعات متنوعة.', 'shapes', 90)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

insert into public.menus (name, location)
values
  ('القائمة الرئيسية', 'header'),
  ('قائمة الجوال', 'mobile'),
  ('قائمة التذييل', 'footer')
on conflict (location) do update set name = excluded.name;

insert into public.homepage_sections (section_key, title, is_enabled, sort_order, item_count)
values
  ('featured', 'مقال مميز', true, 10, 1),
  ('latest_posts', 'أحدث المقالات', true, 20, 6),
  ('content_types', 'أنواع المحتوى', true, 30, 5),
  ('categories', 'تصفح الأقسام', true, 40, 9),
  ('quick_notes', 'ملاحظات سريعة', true, 50, 4),
  ('medical', 'طب وصيدلة', true, 60, 3),
  ('culture', 'ثقافة ولغة', true, 70, 3),
  ('thought', 'دين وفكر', true, 80, 3),
  ('diaries', 'اليوميات', true, 90, 4),
  ('links', 'روابط تستحق القراءة', true, 100, 4),
  ('popular', 'الأكثر قراءة', true, 110, 5),
  ('newsletter', 'ابقَ قريبًا', true, 120, 1)
on conflict (section_key) do update set
  title = excluded.title,
  sort_order = excluded.sort_order,
  item_count = excluded.item_count;

insert into public.site_settings (
  id, site_name, site_description, author_name, author_bio, social_links, default_theme
)
values (
  true,
  'معتز العلقمي',
  'منصة شخصية للنشر والمعرفة والتدوين',
  'معتز العلقمي',
  '',
  '{}'::jsonb,
  'system'
)
on conflict (id) do nothing;

insert into public.announcements (text, url, icon, is_active, priority, dismissible)
select 'مرحبًا بك في مدونتي — تابع الجديد من لوحة التحكم بعد ربط القنوات.', null, 'sparkles', true, 10, true
where not exists (select 1 from public.announcements);
