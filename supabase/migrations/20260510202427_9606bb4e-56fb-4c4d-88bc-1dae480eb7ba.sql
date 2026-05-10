-- 1) Hide internal_notes from public/authenticated viewers of live_streams.
--    Admins still see everything via their own admin SELECT policy.
REVOKE SELECT (internal_notes) ON public.live_streams FROM anon, authenticated;

-- 2) Explicit public SELECT policy for the research-public storage bucket.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public can read research-public bucket'
  ) THEN
    CREATE POLICY "Public can read research-public bucket"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'research-public');
  END IF;
END$$;

-- 3) Pin search_path on email helper functions.
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;