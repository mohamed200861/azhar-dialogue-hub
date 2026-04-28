
-- 1) Bootstrap function: enforce caller == _user_id
CREATE OR REPLACE FUNCTION public.bootstrap_first_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'super_admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$function$;

-- 2) Revoke broad EXECUTE on internal helper functions; they only need to run from RLS expressions and SECURITY DEFINER context.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid)            FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_publish(uuid)         FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at()        FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()         FROM anon, authenticated, public;

-- bootstrap + status remain callable: bootstrap requires auth, status is needed pre-setup
GRANT EXECUTE ON FUNCTION public.bootstrap_first_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_has_any_super_admin()      TO anon, authenticated;

-- 3) Make documents and attachments buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('documents', 'attachments');

-- Drop any blanket public read on these buckets and add admin-only read.
DO $$
BEGIN
  -- Remove existing permissive policies that may grant public read
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read all buckets') THEN
    DROP POLICY "Public read all buckets" ON storage.objects;
  END IF;
END $$;

-- Public read only for media buckets
DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;
CREATE POLICY "Public read media buckets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('images','covers','thumbnails'));

-- Admin read for private buckets
DROP POLICY IF EXISTS "Admins read private buckets" ON storage.objects;
CREATE POLICY "Admins read private buckets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('documents','attachments') AND public.is_admin(auth.uid()));

-- 4) Audit logs: restrict INSERT to admins
DROP POLICY IF EXISTS "Authenticated insert logs" ON public.audit_logs;
CREATE POLICY "Admins insert logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND admin_user_id = auth.uid());

-- 5) Site settings: restrict public read to safe allowlist
DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;
CREATE POLICY "Public read public settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (key IN (
  'site_name','site_description','logo_url','favicon_url',
  'contact_email','contact_phone','contact_address',
  'social_facebook','social_twitter','social_youtube','social_instagram','social_telegram','social_whatsapp',
  'footer_text','homepage_hero','homepage_about','homepage_cta',
  'about_content','vision_content','partnerships_content',
  'privacy_content','terms_content',
  'meta_keywords','meta_description'
));

-- Admins still see everything via existing "Admins manage settings" ALL policy
