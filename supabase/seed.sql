-- Optional idempotent development seed for the isolated blog schema. No credentials or real personal data.
insert into blog.categories(name,slug,description,icon,color,sort_order,is_active) values
('طبي','medical','محتوى طبي تثقيفي','heart-pulse',null,10,true),
('صيدلاني','pharmacy','معرفة دوائية وصيدلانية','pill',null,20,true),
('ثقافي','culture','قراءة وثقافة وأفكار','book-open',null,30,true),
('لغوي','language','اللغة العربية والتعبير','languages',null,40,true),
('ديني','religion','تأملات ومعرفة دينية','moon-star',null,50,true),
('فكري','thought','أفكار وتأملات','brain',null,60,true),
('تقني','technology','تقنية وأدوات رقمية','cpu',null,70,true),
('شخصي','personal','يوميات وتجارب شخصية','user-round',null,80,true),
('متنوع','misc','موضوعات متنوعة','shapes',null,90,true)
on conflict(slug) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order,is_active=excluded.is_active;

insert into blog.site_settings(id,site_name,site_description,author_name,author_bio,social_links,default_theme)
values(true,'معتز العلقمي','منصة شخصية للنشر والمعرفة والتدوين','معتز العلقمي','','{}'::jsonb,'system')
on conflict(id) do update set site_name=excluded.site_name,site_description=excluded.site_description,author_name=excluded.author_name;

insert into blog.menus(name,location) values('القائمة الرئيسية','header'),('قائمة الجوال','mobile'),('قائمة التذييل','footer')
on conflict(location) do update set name=excluded.name;

insert into blog.homepage_sections(section_key,title,is_enabled,sort_order,item_count) values
('featured','المميز',true,10,1),('latest_posts','أحدث المقالات',true,20,6),('content_types','أنواع المحتوى',true,30,5),('categories','الأقسام',true,40,9),('quick_notes','ملاحظات سريعة',true,50,4),('medical','طبي وصيدلاني',true,60,3),('culture','ثقافة ولغة',true,70,3),('thought','دين وفكر',true,80,3),('diaries','من اليوميات',true,90,4),('links','روابط مختارة',true,100,5),('popular','الأكثر قراءة',true,110,5),('newsletter','النشرة البريدية',true,120,1)
on conflict(section_key) do update set title=excluded.title,is_enabled=excluded.is_enabled,sort_order=excluded.sort_order,item_count=excluded.item_count;

insert into blog.announcements(text,url,icon,is_active,priority,dismissible)
select 'هذه نسخة تطويرية من منصة معتز العلقمي','/about','info',true,0,true
where not exists(select 1 from blog.announcements where text='هذه نسخة تطويرية من منصة معتز العلقمي');
