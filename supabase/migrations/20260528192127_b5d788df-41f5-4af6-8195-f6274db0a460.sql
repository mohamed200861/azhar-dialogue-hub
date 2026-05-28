
-- =========================================================================
-- MEMBERSHIPS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.membership_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  duration_months integer,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.membership_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_types TO authenticated;
GRANT ALL ON public.membership_types TO service_role;
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active membership types"
  ON public.membership_types FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all membership types"
  ON public.membership_types FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors create membership types"
  ON public.membership_types FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update membership types"
  ON public.membership_types FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete membership types"
  ON public.membership_types FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_touch_membership_types
  BEFORE UPDATE ON public.membership_types
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TYPE public.membership_application_status AS ENUM
  ('new','under_review','approved','rejected','payment_pending','completed');

CREATE TABLE IF NOT EXISTS public.membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_type_id uuid,
  full_name_ar text NOT NULL,
  full_name_en text,
  residence_country text,
  citizenship text,
  academic_specialization text,
  job_title text,
  scientific_contributions text,
  phone text,
  mobile text,
  email text NOT NULL,
  social_links text,
  cv_url text,
  personal_photo_url text,
  recommendation_1_name text,
  recommendation_1_membership_no text,
  recommendation_1_note text,
  recommendation_2_name text,
  recommendation_2_membership_no text,
  recommendation_2_note text,
  status public.membership_application_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_applications TO authenticated;
GRANT INSERT ON public.membership_applications TO anon;
GRANT ALL ON public.membership_applications TO service_role;
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone submits membership application"
  ON public.membership_applications FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND admin_notes IS NULL
    AND length(btrim(full_name_ar)) BETWEEN 1 AND 200
    AND length(btrim(email)) BETWEEN 3 AND 320
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR length(phone) <= 50)
    AND (mobile IS NULL OR length(mobile) <= 50)
    AND (residence_country IS NULL OR length(residence_country) <= 100)
    AND (citizenship IS NULL OR length(citizenship) <= 100)
    AND (academic_specialization IS NULL OR length(academic_specialization) <= 500)
    AND (job_title IS NULL OR length(job_title) <= 200)
    AND (scientific_contributions IS NULL OR length(scientific_contributions) <= 8000)
    AND (social_links IS NULL OR length(social_links) <= 1000)
  );
CREATE POLICY "Admins read membership applications"
  ON public.membership_applications FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins update membership applications"
  ON public.membership_applications FOR UPDATE TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Super admins delete membership applications"
  ON public.membership_applications FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_touch_membership_applications
  BEFORE UPDATE ON public.membership_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TYPE public.membership_payment_status AS ENUM
  ('pending','paid','failed','refunded');

CREATE TABLE IF NOT EXISTS public.membership_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL,
  title text NOT NULL,
  description text,
  instructions text,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.membership_payment_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_payment_methods TO authenticated;
GRANT ALL ON public.membership_payment_methods TO service_role;
ALTER TABLE public.membership_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads enabled payment methods"
  ON public.membership_payment_methods FOR SELECT TO anon, authenticated USING (is_enabled = true);
CREATE POLICY "Admins read all payment methods"
  ON public.membership_payment_methods FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins manage payment methods"
  ON public.membership_payment_methods FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_touch_membership_methods
  BEFORE UPDATE ON public.membership_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.membership_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid,
  method_key text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.membership_payment_status NOT NULL DEFAULT 'pending',
  reference text,
  paid_at timestamptz,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_payments TO authenticated;
GRANT ALL ON public.membership_payments TO service_role;
ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage membership payments"
  ON public.membership_payments FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_touch_membership_payments
  BEFORE UPDATE ON public.membership_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.membership_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  title text,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.membership_documents TO authenticated;
GRANT ALL ON public.membership_documents TO service_role;
ALTER TABLE public.membership_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage membership documents"
  ON public.membership_documents FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.membership_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.membership_status_history TO authenticated;
GRANT ALL ON public.membership_status_history TO service_role;
ALTER TABLE public.membership_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read status history"
  ON public.membership_status_history FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins insert status history"
  ON public.membership_status_history FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND changed_by = auth.uid());

-- =========================================================================
-- QURAN
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.quran_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quran_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_categories TO authenticated;
GRANT ALL ON public.quran_categories TO service_role;
ALTER TABLE public.quran_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active quran categories"
  ON public.quran_categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all quran categories"
  ON public.quran_categories FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write quran categories"
  ON public.quran_categories FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update quran categories"
  ON public.quran_categories FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete quran categories"
  ON public.quran_categories FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_quran_categories BEFORE UPDATE ON public.quran_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.quran_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quran_teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_teachers TO authenticated;
GRANT ALL ON public.quran_teachers TO service_role;
ALTER TABLE public.quran_teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active quran teachers"
  ON public.quran_teachers FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all quran teachers"
  ON public.quran_teachers FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write quran teachers"
  ON public.quran_teachers FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update quran teachers"
  ON public.quran_teachers FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete quran teachers"
  ON public.quran_teachers FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_quran_teachers BEFORE UPDATE ON public.quran_teachers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.quran_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  thumbnail text,
  video_url text,
  audio_url text,
  pdf_url text,
  text_content text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  category_id uuid,
  teacher_id uuid,
  duration text,
  publish_status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quran_lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_lessons TO authenticated;
GRANT ALL ON public.quran_lessons TO service_role;
ALTER TABLE public.quran_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published quran lessons"
  ON public.quran_lessons FOR SELECT TO anon, authenticated USING (publish_status = 'published');
CREATE POLICY "Admins read all quran lessons"
  ON public.quran_lessons FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write quran lessons"
  ON public.quran_lessons FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update quran lessons"
  ON public.quran_lessons FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete quran lessons"
  ON public.quran_lessons FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_quran_lessons BEFORE UPDATE ON public.quran_lessons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.quran_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail text,
  video_url text NOT NULL,
  embed_url text,
  category_id uuid,
  teacher_id uuid,
  publish_status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quran_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_videos TO authenticated;
GRANT ALL ON public.quran_videos TO service_role;
ALTER TABLE public.quran_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published quran videos"
  ON public.quran_videos FOR SELECT TO anon, authenticated USING (publish_status = 'published');
CREATE POLICY "Admins read all quran videos"
  ON public.quran_videos FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write quran videos"
  ON public.quran_videos FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update quran videos"
  ON public.quran_videos FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete quran videos"
  ON public.quran_videos FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_quran_videos BEFORE UPDATE ON public.quran_videos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.quran_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  category_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quran_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_materials TO authenticated;
GRANT ALL ON public.quran_materials TO service_role;
ALTER TABLE public.quran_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active quran materials"
  ON public.quran_materials FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all quran materials"
  ON public.quran_materials FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write quran materials"
  ON public.quran_materials FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update quran materials"
  ON public.quran_materials FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete quran materials"
  ON public.quran_materials FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_quran_materials BEFORE UPDATE ON public.quran_materials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TYPE public.quran_enrollment_status AS ENUM ('new','approved','rejected');

CREATE TABLE IF NOT EXISTS public.quran_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  notes text,
  status public.quran_enrollment_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_enrollments TO authenticated;
GRANT INSERT ON public.quran_enrollments TO anon;
GRANT ALL ON public.quran_enrollments TO service_role;
ALTER TABLE public.quran_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits quran enrollment"
  ON public.quran_enrollments FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new' AND admin_notes IS NULL
    AND length(btrim(full_name)) BETWEEN 1 AND 200
    AND length(btrim(email)) BETWEEN 3 AND 320
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR length(phone) <= 50)
    AND (country IS NULL OR length(country) <= 100)
    AND (notes IS NULL OR length(notes) <= 4000)
  );
CREATE POLICY "Admins read quran enrollments"
  ON public.quran_enrollments FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins update quran enrollments"
  ON public.quran_enrollments FOR UPDATE TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Super admins delete quran enrollments"
  ON public.quran_enrollments FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_quran_enrollments BEFORE UPDATE ON public.quran_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================================
-- KHUTBAHS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.khutbah_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.khutbah_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.khutbah_categories TO authenticated;
GRANT ALL ON public.khutbah_categories TO service_role;
ALTER TABLE public.khutbah_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active khutbah categories"
  ON public.khutbah_categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all khutbah categories"
  ON public.khutbah_categories FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write khutbah categories"
  ON public.khutbah_categories FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update khutbah categories"
  ON public.khutbah_categories FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete khutbah categories"
  ON public.khutbah_categories FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_khutbah_categories BEFORE UPDATE ON public.khutbah_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.khutbah_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  biography text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.khutbah_speakers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.khutbah_speakers TO authenticated;
GRANT ALL ON public.khutbah_speakers TO service_role;
ALTER TABLE public.khutbah_speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active khutbah speakers"
  ON public.khutbah_speakers FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all khutbah speakers"
  ON public.khutbah_speakers FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write khutbah speakers"
  ON public.khutbah_speakers FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update khutbah speakers"
  ON public.khutbah_speakers FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete khutbah speakers"
  ON public.khutbah_speakers FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_khutbah_speakers BEFORE UPDATE ON public.khutbah_speakers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.khutbahs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  speaker_id uuid,
  speaker_name text,
  mosque text,
  location text,
  category_id uuid,
  khutbah_date date,
  audio_url text,
  video_url text,
  embed_url text,
  transcript text,
  featured_image text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  publish_status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.khutbahs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.khutbahs TO authenticated;
GRANT ALL ON public.khutbahs TO service_role;
ALTER TABLE public.khutbahs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published khutbahs"
  ON public.khutbahs FOR SELECT TO anon, authenticated USING (publish_status = 'published');
CREATE POLICY "Admins read all khutbahs"
  ON public.khutbahs FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors write khutbahs"
  ON public.khutbahs FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update khutbahs"
  ON public.khutbahs FOR UPDATE TO authenticated
  USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete khutbahs"
  ON public.khutbahs FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_touch_khutbahs BEFORE UPDATE ON public.khutbahs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================================
-- FATWA REQUESTS: priority + assignment
-- =========================================================================
ALTER TABLE public.fatwa_arbitration_requests
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- =========================================================================
-- STORAGE BUCKETS
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('membership-attachments','membership-attachments', false),
  ('quran-thumbnails','quran-thumbnails', true),
  ('quran-videos-media','quran-videos-media', true),
  ('quran-materials','quran-materials', true),
  ('khutbah-media','khutbah-media', true),
  ('khutbah-images','khutbah-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for public buckets
CREATE POLICY "Public read quran-thumbnails"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'quran-thumbnails');
CREATE POLICY "Public read quran-videos-media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'quran-videos-media');
CREATE POLICY "Public read quran-materials"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'quran-materials');
CREATE POLICY "Public read khutbah-media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'khutbah-media');
CREATE POLICY "Public read khutbah-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'khutbah-images');

-- Admins/editors upload to public buckets
CREATE POLICY "Editors upload quran public buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('quran-thumbnails','quran-videos-media','quran-materials','khutbah-media','khutbah-images')
    AND can_publish(auth.uid())
  );
CREATE POLICY "Editors update quran public buckets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('quran-thumbnails','quran-videos-media','quran-materials','khutbah-media','khutbah-images')
    AND can_publish(auth.uid())
  );
CREATE POLICY "Editors delete quran public buckets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('quran-thumbnails','quran-videos-media','quran-materials','khutbah-media','khutbah-images')
    AND can_publish(auth.uid())
  );

-- Private membership-attachments: applicant uploads to uuid folder, only admins read
CREATE POLICY "Anyone uploads to membership-attachments"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'membership-attachments');
CREATE POLICY "Admins read membership-attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'membership-attachments' AND is_admin(auth.uid()));
CREATE POLICY "Super admins delete membership-attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'membership-attachments' AND has_role(auth.uid(),'super_admin'::app_role));

-- =========================================================================
-- ADMIN MODULES seed (new modules)
-- =========================================================================
INSERT INTO public.admin_modules (key, label, description, sort_order) VALUES
  ('memberships','العضوية - الأنواع','إدارة أنواع العضوية', 50),
  ('membership_applications','طلبات العضوية','مراجعة طلبات العضوية', 51),
  ('membership_methods','وسائل دفع العضوية','إدارة طرق الدفع', 52),
  ('membership_payments','مدفوعات العضوية','تتبع مدفوعات العضوية', 53),
  ('quran_categories','تصنيفات القرآن','إدارة تصنيفات القرآن', 60),
  ('quran_teachers','معلمو القرآن','إدارة المعلمين', 61),
  ('quran_courses','دورات/دروس القرآن','إدارة الدروس', 62),
  ('quran_videos','مرئيات القرآن','إدارة الفيديوهات', 63),
  ('quran_materials','مواد القرآن','إدارة المواد التعليمية', 64),
  ('quran_enrollments','تسجيلات القرآن','مراجعة طلبات التسجيل', 65),
  ('khutbahs','الخطب','إدارة الخطب', 70),
  ('khutbah_speakers','الخطباء','إدارة الخطباء', 71),
  ('khutbah_categories','تصنيفات الخطب','إدارة التصنيفات', 72)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;

-- =========================================================================
-- SEED some default content
-- =========================================================================
INSERT INTO public.membership_types (slug, title_ar, title_en, description_ar, price, currency, sort_order) VALUES
  ('individual','عضوية فردية','Individual','عضوية للأفراد الراغبين بالانضمام لاتحاد علماء الأزهر.', 0,'USD', 10),
  ('scientific','عضوية علمية','Scientific','عضوية مخصصة للعلماء وطلاب العلم المتخصصين.', 0,'USD', 20),
  ('institutional','عضوية مؤسسية','Institutional','عضوية للمؤسسات الإسلامية والعلمية.', 0,'USD', 30),
  ('international','عضوية دولية','International','عضوية للعلماء من خارج العالم العربي.', 0,'USD', 40),
  ('honorary','عضوية شرفية','Honorary','عضوية شرفية بترشيح خاص.', 0,'USD', 50),
  ('corporate','عضوية الشركات والمؤسسات','Corporate','عضوية للشركات والمؤسسات الراعية.', 0,'USD', 60)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.membership_payment_methods (provider_key, title, description, instructions, is_enabled, sort_order) VALUES
  ('manual','الدفع اليدوي / حوالة','دفع عبر حوالة بنكية أو يدويًا','سيتم التواصل معكم لتنسيق طريقة الدفع بعد قبول الطلب.', true, 10),
  ('bank','حوالة بنكية','تحويل مصرفي مباشر','تفاصيل الحساب سترسل عبر البريد الإلكتروني بعد القبول.', true, 20)
ON CONFLICT DO NOTHING;

INSERT INTO public.quran_categories (slug, title, sort_order) VALUES
  ('recitation','التلاوة', 10),
  ('tajweed','التجويد', 20),
  ('memorization','الحفظ', 30),
  ('tafseer','التفسير', 40),
  ('correction','التصحيح', 50),
  ('children','دورات الأطفال', 60)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.khutbah_categories (slug, title, sort_order) VALUES
  ('friday','الجمعة', 10),
  ('occasions','المناسبات', 20),
  ('youth','الشباب', 30),
  ('family','الأسرة', 40),
  ('ethics','الأخلاق', 50),
  ('aqidah','العقيدة', 60),
  ('dawah','الدعوة', 70)
ON CONFLICT (slug) DO NOTHING;
