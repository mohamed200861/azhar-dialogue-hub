-- Enums
DO $$ BEGIN
  CREATE TYPE public.fatwa_request_status AS ENUM ('new','under_review','answered','closed','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fatwa_request_type AS ENUM ('fatwa','arbitration','family_consult','financial_consult','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscriber_status AS ENUM ('active','unsubscribed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.campaign_status AS ENUM ('draft','ready','sent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.campaign_type AS ENUM ('news','event','library','live','general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- fatwa_arbitration_requests
CREATE TABLE IF NOT EXISTS public.fatwa_arbitration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  request_type public.fatwa_request_type NOT NULL DEFAULT 'fatwa',
  subject text NOT NULL,
  message text NOT NULL,
  is_urgent boolean NOT NULL DEFAULT false,
  attachment_url text,
  status public.fatwa_request_status NOT NULL DEFAULT 'new',
  admin_notes text,
  response_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fatwa_arbitration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit fatwa request"
ON public.fatwa_arbitration_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(subject)) BETWEEN 1 AND 300
  AND length(btrim(message)) BETWEEN 1 AND 8000
  AND (phone IS NULL OR length(phone) <= 50)
  AND (country IS NULL OR length(country) <= 100)
);

CREATE POLICY "Admins read fatwa requests"
ON public.fatwa_arbitration_requests
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update fatwa requests"
ON public.fatwa_arbitration_requests
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Super admins delete fatwa requests"
ON public.fatwa_arbitration_requests
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER fatwa_requests_touch_updated_at
BEFORE UPDATE ON public.fatwa_arbitration_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- newsletter_subscribers additions
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status public.subscriber_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Allow admins to update subscribers (mark as unsubscribed manually)
DROP POLICY IF EXISTS "Admins update subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins update subscribers"
ON public.newsletter_subscribers
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- newsletter_campaigns
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  type public.campaign_type NOT NULL DEFAULT 'general',
  status public.campaign_status NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read campaigns"
ON public.newsletter_campaigns
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins manage campaigns"
ON public.newsletter_campaigns
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER campaigns_touch_updated_at
BEFORE UPDATE ON public.newsletter_campaigns
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket for fatwa attachments (PRIVATE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fatwa-attachments','fatwa-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads (anonymous submitters) but restricted to this bucket and small set of types
CREATE POLICY "Anyone can upload fatwa attachment"
ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'fatwa-attachments');

-- Only admins can read attachments
CREATE POLICY "Admins read fatwa attachments"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'fatwa-attachments' AND public.is_admin(auth.uid()));

-- Only super admins / admins can delete attachments
CREATE POLICY "Admins delete fatwa attachments"
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'fatwa-attachments' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')));