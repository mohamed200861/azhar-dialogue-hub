
-- Phase 1: granular module-level admin permissions (additive only)

CREATE TABLE IF NOT EXISTS public.admin_modules (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read modules" ON public.admin_modules
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admins manage modules" ON public.admin_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.admin_modules (key, label, sort_order) VALUES
  ('news','الأخبار',10),
  ('library','المكتبة',20),
  ('videos','المرئيات',30),
  ('events','الفعاليات',40),
  ('live','البث المباشر',50),
  ('pages','الصفحات',60),
  ('media','الوسائط',70),
  ('messages','رسائل التواصل',80),
  ('newsletter','النشرة البريدية',90),
  ('fatwa','الفتوى والتحكيم',100),
  ('fatwa_files','ملفات الفتوى العامة',110),
  ('fatwa_departments','أقسام الفتوى',115),
  ('feedback','آراء القراء',120),
  ('sharia_academy','الأكاديمية الشرعية',130),
  ('civilizational_dialogue','الحوار الحضاري',140),
  ('research','الأبحاث والدراسات',150),
  ('news_ticker','شريط الأخبار',160),
  ('settings','الإعدادات',170),
  ('admins','المسؤولون',180),
  ('roles','الأدوار والصلاحيات',185),
  ('memberships','العضوية',200),
  ('membership_applications','طلبات العضوية',210),
  ('membership_methods','وسائل الدفع',220),
  ('quran_courses','دورات القرآن الكريم',300),
  ('quran_enrollments','تسجيلات دورات القرآن',310),
  ('quran_teachers','معلمو القرآن',320)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.admin_module_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_key text NOT NULL REFERENCES public.admin_modules(key) ON DELETE CASCADE,
  can_read boolean NOT NULL DEFAULT true,
  can_write boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_admin_module_grants_user ON public.admin_module_grants(user_id);

ALTER TABLE public.admin_module_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own grants" ON public.admin_module_grants
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins read all grants" ON public.admin_module_grants
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins manage grants" ON public.admin_module_grants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_admin_module_grants_updated
  BEFORE UPDATE ON public.admin_module_grants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helper: super_admin/admin always pass; otherwise consult grants.
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text, _level text DEFAULT 'read')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN _user_id IS NULL THEN false
      WHEN public.has_role(_user_id, 'super_admin'::app_role) THEN true
      WHEN public.has_role(_user_id, 'admin'::app_role) THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.admin_module_grants g
        WHERE g.user_id = _user_id
          AND g.module_key = _module
          AND (
            (_level = 'read'   AND g.can_read) OR
            (_level = 'write'  AND g.can_write) OR
            (_level = 'delete' AND g.can_delete)
          )
      )
    END
$$;
