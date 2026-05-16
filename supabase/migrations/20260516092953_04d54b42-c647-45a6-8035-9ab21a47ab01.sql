
-- ============ FATWA PUBLIC FILES ============
CREATE TABLE public.fatwa_public_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text,
  file_type text,
  file_size bigint,
  category text NOT NULL DEFAULT 'general',
  publish_status text NOT NULL DEFAULT 'published',
  display_order integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fatwa_public_files_category_check CHECK (category IN ('general','forms','regulations','guides','announcements')),
  CONSTRAINT fatwa_public_files_status_check CHECK (publish_status IN ('draft','published','archived'))
);

ALTER TABLE public.fatwa_public_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published fatwa files"
  ON public.fatwa_public_files FOR SELECT
  TO anon, authenticated
  USING (publish_status = 'published');

CREATE POLICY "Admins read all fatwa files"
  ON public.fatwa_public_files FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Editors insert fatwa files"
  ON public.fatwa_public_files FOR INSERT
  TO authenticated
  WITH CHECK (can_publish(auth.uid()));

CREATE POLICY "Editors update fatwa files"
  ON public.fatwa_public_files FOR UPDATE
  TO authenticated
  USING (can_publish(auth.uid()))
  WITH CHECK (can_publish(auth.uid()));

CREATE POLICY "Super admins delete fatwa files"
  ON public.fatwa_public_files FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_fatwa_public_files_updated
  BEFORE UPDATE ON public.fatwa_public_files
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PUBLIC BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('fatwa-public-files', 'fatwa-public-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read fatwa public files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'fatwa-public-files');

CREATE POLICY "Editors upload fatwa public files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'fatwa-public-files' AND can_publish(auth.uid()));

CREATE POLICY "Editors update fatwa public files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'fatwa-public-files' AND can_publish(auth.uid()))
  WITH CHECK (bucket_id = 'fatwa-public-files' AND can_publish(auth.uid()));

CREATE POLICY "Super admins delete fatwa public files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'fatwa-public-files' AND has_role(auth.uid(), 'super_admin'::app_role));

-- ============ READER FEEDBACK ============
CREATE TABLE public.reader_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text,
  page_path text,
  author_name text NOT NULL,
  author_email text,
  rating integer NOT NULL,
  comment text,
  status text NOT NULL DEFAULT 'pending',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reader_feedback_rating_check CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reader_feedback_status_check CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT reader_feedback_name_len CHECK (length(btrim(author_name)) BETWEEN 1 AND 120),
  CONSTRAINT reader_feedback_email_fmt CHECK (author_email IS NULL OR author_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT reader_feedback_comment_len CHECK (comment IS NULL OR length(comment) <= 2000),
  CONSTRAINT reader_feedback_entity_type_len CHECK (length(entity_type) <= 50),
  CONSTRAINT reader_feedback_no_html CHECK (
    (comment IS NULL OR comment !~* '<[a-z!/]') AND
    (author_name !~* '<[a-z!/]')
  )
);

CREATE INDEX reader_feedback_entity_idx
  ON public.reader_feedback (entity_type, entity_id, status);
CREATE INDEX reader_feedback_status_created_idx
  ON public.reader_feedback (status, created_at DESC);

ALTER TABLE public.reader_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads approved feedback"
  ON public.reader_feedback FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Admins read all feedback"
  ON public.reader_feedback FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone submits feedback"
  ON public.reader_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND rating BETWEEN 1 AND 5
    AND length(btrim(author_name)) BETWEEN 1 AND 120
    AND (author_email IS NULL OR length(author_email) <= 320)
    AND (comment IS NULL OR length(comment) <= 2000)
    AND length(entity_type) <= 50
    AND (entity_id IS NULL OR length(entity_id) <= 100)
    AND (page_path IS NULL OR length(page_path) <= 300)
  );

CREATE POLICY "Admins update feedback"
  ON public.reader_feedback FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins delete feedback"
  ON public.reader_feedback FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_reader_feedback_updated
  BEFORE UPDATE ON public.reader_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
