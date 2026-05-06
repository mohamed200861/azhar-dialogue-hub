
-- News ticker items table
CREATE TABLE IF NOT EXISTS public.news_ticker_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link_url TEXT,
  badge TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news_ticker_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active ticker"
  ON public.news_ticker_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND status = 'published');

CREATE POLICY "Admins read all ticker"
  ON public.news_ticker_items FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Editors create ticker"
  ON public.news_ticker_items FOR INSERT
  TO authenticated
  WITH CHECK (can_publish(auth.uid()));

CREATE POLICY "Editors update ticker"
  ON public.news_ticker_items FOR UPDATE
  TO authenticated
  USING (can_publish(auth.uid()))
  WITH CHECK (can_publish(auth.uid()));

CREATE POLICY "Super admins delete ticker"
  ON public.news_ticker_items FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_news_ticker_touch
  BEFORE UPDATE ON public.news_ticker_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Public research bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('research-public', 'research-public', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read research-public"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'research-public');

CREATE POLICY "Admins upload research-public"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'research-public' AND is_admin(auth.uid()));

CREATE POLICY "Admins update research-public"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'research-public' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'research-public' AND is_admin(auth.uid()));

CREATE POLICY "Super admins delete research-public"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'research-public' AND has_role(auth.uid(), 'super_admin'::app_role));
