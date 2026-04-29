
-- 1) Drop visibility table (no longer used)
DROP TABLE IF EXISTS public.site_visibility CASCADE;

-- 2) Expand site_pages
ALTER TABLE public.site_pages
  ADD COLUMN IF NOT EXISTS subtitle text DEFAULT '',
  ADD COLUMN IF NOT EXISTS intro text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS sections jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3) Seed homepage CMS row
INSERT INTO public.site_pages (page_key, slug, title, subtitle, intro, content, status, show_in_header, show_in_footer, display_order, sections)
VALUES (
  'home', 'home', 'الصفحة الرئيسية',
  'منهج أزهري… ورسالة عالمية',
  'مؤسسة إسلامية دعوية علمية غير ربحية تسعى إلى نشر المنهج الأزهري الوسطي وخدمة قضايا الأمة وتعزيز القيم الإسلامية في المجتمعات المعاصرة.',
  '', 'published', false, false, 0,
  jsonb_build_object(
    'hero_badge', 'مؤسسة إسلامية دعوية علمية',
    'about_section_title', 'منهج أزهري وسطي يخدم الأمة والإنسانية',
    'about_section_eyebrow', 'من نحن',
    'work_areas_title', 'مجالات عمل الاتحاد',
    'work_areas_desc', 'يعمل اتحاد علماء الأزهر في خمسة مجالات رئيسية تخدم رسالته العلمية والدعوية والاجتماعية.',
    'news_section_title', 'آخر الأخبار والبيانات',
    'events_section_title', 'الفعاليات القادمة',
    'library_section_title', 'المكتبة الرقمية',
    'library_section_desc', 'كتب وبحوث وإصدارات الاتحاد متاحة للقراءة والتحميل.',
    'videos_section_title', 'المرئيات والبث المباشر',
    'videos_section_desc', 'محاضرات ولقاءات وبثوث مباشرة تواكب أنشطة الاتحاد.',
    'partnerships_cta_title', 'شراكاتنا المؤسسية',
    'newsletter_title', 'اشترك في النشرة البريدية',
    'newsletter_desc', 'احصل على آخر البيانات والأخبار والإصدارات في بريدك مباشرة.'
  )
)
ON CONFLICT (page_key) DO NOTHING;

-- Make sure page_key is unique (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_pages_page_key_key') THEN
    ALTER TABLE public.site_pages ADD CONSTRAINT site_pages_page_key_key UNIQUE (page_key);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4) Live stream controls
ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS hide_from_homepage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_from_videos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_archive boolean NOT NULL DEFAULT true;

-- 5) Enable realtime on relevant tables
ALTER TABLE public.site_settings REPLICA IDENTITY FULL;
ALTER TABLE public.site_pages REPLICA IDENTITY FULL;
ALTER TABLE public.live_streams REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.site_pages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
