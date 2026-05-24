
CREATE TABLE IF NOT EXISTS public.fatwa_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fatwa_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active fatwa departments" ON public.fatwa_departments
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all fatwa departments" ON public.fatwa_departments
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Editors insert fatwa departments" ON public.fatwa_departments
  FOR INSERT TO authenticated WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Editors update fatwa departments" ON public.fatwa_departments
  FOR UPDATE TO authenticated
  USING (public.can_publish(auth.uid())) WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Super admins delete fatwa departments" ON public.fatwa_departments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'::app_role));

CREATE TRIGGER trg_fatwa_departments_updated
  BEFORE UPDATE ON public.fatwa_departments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.fatwa_arbitration_requests
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.fatwa_departments(id) ON DELETE SET NULL;
ALTER TABLE public.fatwa_public_files
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.fatwa_departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fatwa_requests_dept ON public.fatwa_arbitration_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_fatwa_files_dept ON public.fatwa_public_files(department_id);

-- Seed common departments
INSERT INTO public.fatwa_departments (title, slug, description, icon, display_order) VALUES
  ('الفتاوى العامة','general','الأسئلة الشرعية العامة في العبادات والمعاملات','Scale',10),
  ('الأحوال الشخصية','personal-status','الزواج، الطلاق، العدة وما يتعلق بها','Users',20),
  ('المعاملات المالية','financial','البيوع والمعاملات المالية المعاصرة','Coins',30),
  ('التحكيم الشرعي','arbitration','طلبات التحكيم في النزاعات وفق الشريعة','Gavel',40),
  ('الأسرة والزواج','family','الاستشارات الأسرية والزوجية','Home',50),
  ('القضايا المعاصرة','contemporary','القضايا الحديثة والنوازل','Newspaper',60),
  ('المواريث','inheritance','أحكام المواريث وتقسيمها','FileText',70),
  ('فتاوى الشباب','youth','الفتاوى الموجهة للشباب','GraduationCap',80)
ON CONFLICT (slug) DO NOTHING;
