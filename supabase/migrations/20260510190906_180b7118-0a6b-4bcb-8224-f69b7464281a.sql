DROP POLICY IF EXISTS "Public read public settings" ON public.site_settings;
CREATE POLICY "Public read public settings" ON public.site_settings
FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY[
  'site_name','site_description','logo_url','favicon_url',
  'contact_email','contact_phone','contact_address',
  'public_contact_email','admin_notification_email','newsletter_sender_email',
  'social_facebook','social_twitter','social_youtube','social_instagram','social_telegram','social_whatsapp',
  'footer_text','homepage_hero','homepage_about','homepage_cta',
  'about_content','vision_content','partnerships_content','privacy_content','terms_content',
  'meta_keywords','meta_description'
]));