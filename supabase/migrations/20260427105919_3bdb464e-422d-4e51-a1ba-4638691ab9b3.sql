-- Sanitize existing slugs that contain slashes, colons or spaces (causes routing 404s)
CREATE OR REPLACE FUNCTION public._sanitize_slug(s text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(lower(coalesce(s,'')), '[^a-z0-9\u0621-\u064a]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    ), ''
  );
$$;

UPDATE public.library_items
   SET slug = COALESCE(public._sanitize_slug(slug), 'item-' || substr(id::text, 1, 8))
 WHERE slug ~ '[/:\\s]' OR slug IS NULL OR length(slug) = 0;

UPDATE public.news_posts
   SET slug = COALESCE(public._sanitize_slug(slug), 'post-' || substr(id::text, 1, 8))
 WHERE slug ~ '[/:\\s]' OR slug IS NULL OR length(slug) = 0;

UPDATE public.events
   SET slug = COALESCE(public._sanitize_slug(slug), 'event-' || substr(id::text, 1, 8))
 WHERE slug ~ '[/:\\s]' OR slug IS NULL OR length(slug) = 0;

UPDATE public.videos
   SET slug = COALESCE(public._sanitize_slug(slug), 'video-' || substr(id::text, 1, 8))
 WHERE slug ~ '[/:\\s]' OR slug IS NULL OR length(slug) = 0;

DROP FUNCTION public._sanitize_slug(text);