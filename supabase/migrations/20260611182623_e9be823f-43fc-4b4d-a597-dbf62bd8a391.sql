DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'live_streams'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.live_streams';
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams
  (id, title, slug, description, platform, live_url, embed_url, thumbnail,
   scheduled_at, status, replay_url, show_on_homepage, show_on_videos_page,
   notify_subscribers, notify_admin, publisher_source, created_by,
   started_at, ended_at, created_at, updated_at, expires_at,
   hide_from_homepage, hide_from_videos, auto_archive);