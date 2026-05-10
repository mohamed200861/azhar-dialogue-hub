
-- Fix 1: Remove broad public SELECT policies on storage.objects that allow listing
DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read research-public bucket" ON storage.objects;

-- Add admin-only SELECT policies for the formerly public buckets so admins can still list/manage files
CREATE POLICY "Admins read public media buckets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = ANY (ARRAY['images'::text, 'covers'::text, 'thumbnails'::text]) AND public.is_admin(auth.uid()));

CREATE POLICY "Admins read research-public bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'research-public'::text AND public.is_admin(auth.uid()));

-- Fix 2: Revoke unnecessary EXECUTE on email queue helper functions from anon/authenticated.
-- These are only called by the process-email-queue edge function using service_role.
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;

-- Leave bootstrap_first_super_admin and public_has_any_super_admin accessible to anon/authenticated
-- because they are required by the /admin/setup and /admin/login flows.
-- Leave has_role, is_admin, can_publish accessible to authenticated because they are used by RLS policies.

-- Fix 3: Ensure the email queue functions remain callable by service_role (they still have it via default or explicit grant)
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

-- Fix 4: Ensure new admin SELECT policies use the helper functions correctly
-- (is_admin is already granted to authenticated, so this is fine)
ANALYZE storage.objects;
