
-- 1) site_settings: remove internal-only keys from public allowlist
DROP POLICY IF EXISTS "Public read public settings" ON public.site_settings;
CREATE POLICY "Public read public settings" ON public.site_settings
FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY[
  'site_name','site_description','logo_url','favicon_url',
  'contact_email','contact_phone','contact_address',
  'public_contact_email',
  'social_facebook','social_twitter','social_youtube','social_instagram','social_telegram','social_whatsapp',
  'footer_text','homepage_hero','homepage_about','homepage_cta',
  'about_content','vision_content','partnerships_content','privacy_content','terms_content',
  'meta_keywords','meta_description'
]));

-- 2) fatwa-attachments: tighten upload + add admin-only update
DROP POLICY IF EXISTS "Anyone can upload fatwa attachment" ON storage.objects;
CREATE POLICY "Anyone can upload fatwa attachment"
ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'fatwa-attachments'
  AND lower(storage.extension(name)) IN ('pdf','png','jpg','jpeg','webp')
  AND COALESCE((metadata->>'size')::bigint, 0) < 8388608
);

DROP POLICY IF EXISTS "Admins update fatwa attachments" ON storage.objects;
CREATE POLICY "Admins update fatwa attachments"
ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'fatwa-attachments' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'fatwa-attachments' AND public.is_admin(auth.uid()));

-- 3) research-submissions: tighten upload + add admin-only update
DROP POLICY IF EXISTS "Anyone uploads research submission file" ON storage.objects;
CREATE POLICY "Anyone uploads research submission file"
ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'research-submissions'
  AND lower(storage.extension(name)) IN ('pdf','doc','docx')
  AND COALESCE((metadata->>'size')::bigint, 0) < 20971520
);

DROP POLICY IF EXISTS "Admins update research submission files" ON storage.objects;
CREATE POLICY "Admins update research submission files"
ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'research-submissions' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'research-submissions' AND public.is_admin(auth.uid()));

-- 4) research-public: remove broad SELECT to disable file listing.
-- Public URLs still work because the bucket is marked public=true.
DROP POLICY IF EXISTS "Public read research-public" ON storage.objects;
