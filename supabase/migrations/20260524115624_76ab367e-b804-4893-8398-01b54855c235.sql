
-- 1) Re-revoke internal_notes from anon/authenticated on live_streams
REVOKE SELECT (internal_notes) ON public.live_streams FROM anon;
REVOKE SELECT (internal_notes) ON public.live_streams FROM authenticated;

-- 2) Restrict anonymous INSERT policies so privileged fields cannot be set

-- contact_messages
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND length(btrim(name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(message)) BETWEEN 1 AND 5000
);

-- fatwa_arbitration_requests
DROP POLICY IF EXISTS "Anyone can submit fatwa request" ON public.fatwa_arbitration_requests;
CREATE POLICY "Anyone can submit fatwa request"
ON public.fatwa_arbitration_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND admin_notes IS NULL
  AND response_text IS NULL
  AND length(btrim(full_name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(subject)) BETWEEN 1 AND 300
  AND length(btrim(message)) BETWEEN 1 AND 8000
  AND (phone IS NULL OR length(phone) <= 50)
  AND (country IS NULL OR length(country) <= 100)
);

-- dialogue_requests
DROP POLICY IF EXISTS "Anyone submits dialogue request" ON public.dialogue_requests;
CREATE POLICY "Anyone submits dialogue request"
ON public.dialogue_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND admin_notes IS NULL
  AND length(btrim(full_name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(message)) BETWEEN 1 AND 5000
  AND (organization IS NULL OR length(organization) <= 200)
  AND (country IS NULL OR length(country) <= 100)
  AND length(request_kind) <= 100
);

-- academy_applications
DROP POLICY IF EXISTS "Anyone submits academy application" ON public.academy_applications;
CREATE POLICY "Anyone submits academy application"
ON public.academy_applications FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND admin_notes IS NULL
  AND length(btrim(full_name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR length(phone) <= 50)
  AND (country IS NULL OR length(country) <= 100)
  AND (qualification IS NULL OR length(qualification) <= 500)
  AND (notes IS NULL OR length(notes) <= 4000)
);

-- research_submissions
DROP POLICY IF EXISTS "Anyone submits research" ON public.research_submissions;
CREATE POLICY "Anyone submits research"
ON public.research_submissions FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND admin_notes IS NULL
  AND length(btrim(full_name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(title)) BETWEEN 3 AND 300
  AND length(btrim(abstract)) BETWEEN 10 AND 8000
);

-- 3) Remove storage listing on fatwa-public-files bucket.
-- Public direct URLs continue to work (bucket is public); only API listing is blocked.
DROP POLICY IF EXISTS "Public read fatwa public files" ON storage.objects;
