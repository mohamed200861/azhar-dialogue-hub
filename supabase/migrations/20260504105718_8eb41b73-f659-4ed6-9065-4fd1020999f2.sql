-- Enums
CREATE TYPE public.academy_program_status AS ENUM ('available','soon','closed');
CREATE TYPE public.academy_program_level AS ENUM ('beginner','intermediate','advanced');
CREATE TYPE public.academy_program_category AS ENUM ('course','diploma','ijaza');
CREATE TYPE public.academy_application_status AS ENUM ('new','reviewing','accepted','rejected');

CREATE TYPE public.dialogue_initiative_type AS ENUM ('meeting','conference','seminar','initiative');
CREATE TYPE public.dialogue_request_status AS ENUM ('new','reviewing','contacted','closed');

CREATE TYPE public.research_category AS ENUM ('sharia','intellectual','contemporary','reports');
CREATE TYPE public.research_submission_status AS ENUM ('new','reviewing','approved','rejected');

-- ===== Academy =====
CREATE TABLE public.academy_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  level academy_program_level NOT NULL DEFAULT 'beginner',
  category academy_program_category NOT NULL DEFAULT 'course',
  status academy_program_status NOT NULL DEFAULT 'available',
  publish_status content_status NOT NULL DEFAULT 'published',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published programs" ON public.academy_programs
  FOR SELECT TO anon, authenticated USING (publish_status = 'published');
CREATE POLICY "Admins read all programs" ON public.academy_programs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors create programs" ON public.academy_programs
  FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update programs" ON public.academy_programs
  FOR UPDATE TO authenticated USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete programs" ON public.academy_programs
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_academy_programs_updated BEFORE UPDATE ON public.academy_programs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.academy_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  program_id UUID REFERENCES public.academy_programs(id) ON DELETE SET NULL,
  program_title TEXT,
  qualification TEXT,
  notes TEXT,
  status academy_application_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits academy application" ON public.academy_applications
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(btrim(full_name)) BETWEEN 1 AND 200 AND
    length(btrim(email)) BETWEEN 3 AND 320 AND
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
    (phone IS NULL OR length(phone) <= 50) AND
    (country IS NULL OR length(country) <= 100) AND
    (qualification IS NULL OR length(qualification) <= 500) AND
    (notes IS NULL OR length(notes) <= 4000)
  );
CREATE POLICY "Admins read academy applications" ON public.academy_applications
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins update academy applications" ON public.academy_applications
  FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Super admins delete academy applications" ON public.academy_applications
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_academy_apps_updated BEFORE UPDATE ON public.academy_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Dialogue =====
CREATE TABLE public.dialogue_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  initiative_date TIMESTAMPTZ,
  initiative_type dialogue_initiative_type NOT NULL DEFAULT 'meeting',
  publish_status content_status NOT NULL DEFAULT 'published',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dialogue_initiatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published initiatives" ON public.dialogue_initiatives
  FOR SELECT TO anon, authenticated USING (publish_status = 'published');
CREATE POLICY "Admins read all initiatives" ON public.dialogue_initiatives
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors create initiatives" ON public.dialogue_initiatives
  FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update initiatives" ON public.dialogue_initiatives
  FOR UPDATE TO authenticated USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete initiatives" ON public.dialogue_initiatives
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_dialogue_init_updated BEFORE UPDATE ON public.dialogue_initiatives
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.dialogue_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  country TEXT,
  request_kind TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status dialogue_request_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dialogue_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits dialogue request" ON public.dialogue_requests
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(btrim(full_name)) BETWEEN 1 AND 200 AND
    length(btrim(email)) BETWEEN 3 AND 320 AND
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
    length(btrim(message)) BETWEEN 1 AND 5000 AND
    (organization IS NULL OR length(organization) <= 200) AND
    (country IS NULL OR length(country) <= 100) AND
    length(request_kind) <= 100
  );
CREATE POLICY "Admins read dialogue requests" ON public.dialogue_requests
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins update dialogue requests" ON public.dialogue_requests
  FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Super admins delete dialogue requests" ON public.dialogue_requests
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_dialogue_req_updated BEFORE UPDATE ON public.dialogue_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Research =====
CREATE TABLE public.research_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  category research_category NOT NULL DEFAULT 'sharia',
  abstract TEXT,
  file_url TEXT,
  external_url TEXT,
  publish_status content_status NOT NULL DEFAULT 'published',
  display_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published research" ON public.research_items
  FOR SELECT TO anon, authenticated USING (publish_status = 'published');
CREATE POLICY "Admins read all research" ON public.research_items
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Editors create research" ON public.research_items
  FOR INSERT TO authenticated WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Editors update research" ON public.research_items
  FOR UPDATE TO authenticated USING (can_publish(auth.uid())) WITH CHECK (can_publish(auth.uid()));
CREATE POLICY "Super admins delete research" ON public.research_items
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_research_items_updated BEFORE UPDATE ON public.research_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.research_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  category research_category NOT NULL DEFAULT 'sharia',
  abstract TEXT NOT NULL,
  attachment_url TEXT,
  status research_submission_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits research" ON public.research_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(btrim(full_name)) BETWEEN 1 AND 200 AND
    length(btrim(email)) BETWEEN 3 AND 320 AND
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
    length(btrim(title)) BETWEEN 3 AND 300 AND
    length(btrim(abstract)) BETWEEN 10 AND 8000
  );
CREATE POLICY "Admins read research submissions" ON public.research_submissions
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins update research submissions" ON public.research_submissions
  FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Super admins delete research submissions" ON public.research_submissions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_research_subs_updated BEFORE UPDATE ON public.research_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Private bucket for research submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('research-submissions','research-submissions', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can upload their own submission file (we generate random paths client-side);
-- only admins can read/list/delete.
CREATE POLICY "Anyone uploads research submission file" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'research-submissions');
CREATE POLICY "Admins read research submission files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'research-submissions' AND is_admin(auth.uid()));
CREATE POLICY "Admins delete research submission files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'research-submissions' AND is_admin(auth.uid()));