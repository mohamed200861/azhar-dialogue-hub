
-- ===== site_pages =====
CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  title text NOT NULL,
  slug text NOT NULL,
  content text DEFAULT '',
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  status content_status NOT NULL DEFAULT 'published',
  show_in_header boolean NOT NULL DEFAULT false,
  show_in_footer boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published pages"
  ON public.site_pages FOR SELECT TO anon, authenticated
  USING (status = 'published'::content_status);

CREATE POLICY "Admins read all pages"
  ON public.site_pages FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins manage pages"
  ON public.site_pages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_pages_updated BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_pages (page_key, title, slug, status, show_in_header, show_in_footer, display_order, content) VALUES
  ('about',        'من نحن',           'about',        'published', true,  true,  10, ''),
  ('vision',       'الرؤية والرسالة',  'vision',       'published', true,  true,  20, ''),
  ('partnerships', 'الشراكات',         'partnerships', 'published', true,  true,  30, ''),
  ('privacy',      'سياسة الخصوصية',   'privacy',      'published', false, true,  90, ''),
  ('terms',        'الأحكام والشروط',  'terms',        'published', false, true, 100, '')
ON CONFLICT (page_key) DO NOTHING;

-- ===== site_visibility =====
CREATE TABLE IF NOT EXISTS public.site_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('page','section')),
  is_visible boolean NOT NULL DEFAULT true,
  show_in_header boolean NOT NULL DEFAULT true,
  show_in_footer boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visibility"
  ON public.site_visibility FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage visibility"
  ON public.site_visibility FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_visibility_updated BEFORE UPDATE ON public.site_visibility
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed pages
INSERT INTO public.site_visibility (key, label, type, is_visible, show_in_header, show_in_footer, display_order) VALUES
  ('page:home',         'الرئيسية',                 'page', true, true,  false, 1),
  ('page:about',        'من نحن',                   'page', true, true,  true,  2),
  ('page:vision',       'الرؤية والرسالة',          'page', true, true,  true,  3),
  ('page:news',         'الأخبار والبيانات',        'page', true, true,  true,  4),
  ('page:events',       'الفعاليات',                'page', true, true,  true,  5),
  ('page:library',      'المكتبة',                  'page', true, true,  true,  6),
  ('page:videos',       'المرئيات والبث المباشر',   'page', true, true,  true,  7),
  ('page:partnerships', 'الشراكات',                 'page', true, true,  true,  8),
  ('page:contact',      'تواصل معنا',               'page', true, true,  true,  9),
  ('page:privacy',      'سياسة الخصوصية',           'page', true, false, true, 10),
  ('page:terms',        'الأحكام والشروط',          'page', true, false, true, 11),
  -- Sections
  ('section:hero',         'الواجهة الرئيسية',          'section', true, false, false, 1),
  ('section:work_areas',   'مجالات عمل الاتحاد',        'section', true, false, false, 2),
  ('section:about',        'من نحن',                    'section', true, false, false, 3),
  ('section:vision',       'الرؤية والرسالة',           'section', true, false, false, 4),
  ('section:news',         'الأخبار الأخيرة',           'section', true, false, false, 5),
  ('section:events',       'الفعاليات القادمة',         'section', true, false, false, 6),
  ('section:library',      'المكتبة',                   'section', true, false, false, 7),
  ('section:videos',       'المرئيات والبث المباشر',    'section', true, false, false, 8),
  ('section:partnerships', 'الشراكات',                  'section', true, false, false, 9),
  ('section:newsletter',   'النشرة البريدية',           'section', true, false, false, 10)
ON CONFLICT (key) DO NOTHING;

-- ===== live_streams =====
DO $$ BEGIN
  CREATE TYPE live_stream_status AS ENUM ('draft','scheduled','live','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  platform text NOT NULL DEFAULT 'YouTube',
  live_url text,
  embed_url text,
  thumbnail text,
  scheduled_at timestamptz,
  status live_stream_status NOT NULL DEFAULT 'draft',
  replay_url text,
  show_on_homepage boolean NOT NULL DEFAULT false,
  show_on_videos_page boolean NOT NULL DEFAULT true,
  notify_subscribers boolean NOT NULL DEFAULT false,
  notify_admin boolean NOT NULL DEFAULT false,
  publisher_source text NOT NULL DEFAULT 'القسم الإعلامي',
  internal_notes text,
  created_by uuid,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled ON public.live_streams(scheduled_at);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads visible live streams"
  ON public.live_streams FOR SELECT TO anon, authenticated
  USING (status IN ('scheduled','live','completed'));

CREATE POLICY "Admins read all live"
  ON public.live_streams FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Editors create live"
  ON public.live_streams FOR INSERT TO authenticated
  WITH CHECK (can_publish(auth.uid()));

CREATE POLICY "Editors update live"
  ON public.live_streams FOR UPDATE TO authenticated
  USING (can_publish(auth.uid()))
  WITH CHECK (can_publish(auth.uid()));

CREATE POLICY "Admins delete live"
  ON public.live_streams FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_live_streams_updated BEFORE UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
