
-- 1) live_streams: hide internal_notes from anon/authenticated via column-level grants
REVOKE SELECT ON public.live_streams FROM anon, authenticated;
GRANT SELECT (
  id, title, slug, description, platform, live_url, embed_url, thumbnail,
  scheduled_at, status, replay_url, show_on_homepage, show_on_videos_page,
  notify_subscribers, notify_admin, publisher_source, created_by,
  started_at, ended_at, created_at, updated_at, expires_at,
  hide_from_homepage, hide_from_videos, auto_archive
) ON public.live_streams TO anon, authenticated;
-- Preserve write capabilities for authenticated (RLS still gates rows)
GRANT INSERT, UPDATE, DELETE ON public.live_streams TO authenticated;

-- 2) membership-attachments: restrict uploads (UUID-prefixed path, ext, size)
DROP POLICY IF EXISTS "Anyone uploads to membership-attachments" ON storage.objects;

CREATE POLICY "Restricted uploads to membership-attachments"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'membership-attachments'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND lower(storage.extension(name)) IN ('pdf','jpg','jpeg','png','webp','doc','docx')
  AND COALESCE((metadata->>'size')::bigint, 0) <= 10485760
);
