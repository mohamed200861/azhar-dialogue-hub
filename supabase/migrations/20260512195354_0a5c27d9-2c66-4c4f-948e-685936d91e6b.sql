-- 1. Remove duplicate triggers (keep only one per table)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tgname, tgrelid::regclass AS tbl,
           ROW_NUMBER() OVER (PARTITION BY tgrelid, tgname ORDER BY oid) AS rn, oid
    FROM pg_trigger
    WHERE tgname IN ('notify_publish_trg','notify_live_change_trg') AND NOT tgisinternal
  LOOP
    IF r.rn > 1 THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', r.tgname, r.tbl);
    END IF;
  END LOOP;
END $$;

-- Recreate single clean triggers (idempotent)
DROP TRIGGER IF EXISTS notify_publish_trg ON public.news_posts;
CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish('news');

DROP TRIGGER IF EXISTS notify_publish_trg ON public.events;
CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish('event');

DROP TRIGGER IF EXISTS notify_publish_trg ON public.library_items;
CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.library_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish('library');

DROP TRIGGER IF EXISTS notify_publish_trg ON public.videos;
CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish('video');

DROP TRIGGER IF EXISTS notify_publish_trg ON public.research_items;
CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.research_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish('research');

DROP TRIGGER IF EXISTS notify_publish_trg ON public.academy_programs;
CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.academy_programs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish('academy');

DROP TRIGGER IF EXISTS notify_publish_trg ON public.dialogue_initiatives;
CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.dialogue_initiatives
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish('dialogue');

-- 2. Public stats (only published content)
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'news',     (SELECT count(*) FROM public.news_posts WHERE status = 'published'),
    'events',   (SELECT count(*) FROM public.events WHERE publish_status = 'published'),
    'videos',   (SELECT count(*) FROM public.videos WHERE status = 'published'),
    'library',  (SELECT count(*) FROM public.library_items WHERE status = 'published'),
    'research', (SELECT count(*) FROM public.research_items WHERE publish_status = 'published'),
    'academy',  (SELECT count(*) FROM public.academy_programs WHERE publish_status = 'published'),
    'dialogue', (SELECT count(*) FROM public.dialogue_initiatives WHERE publish_status = 'published')
  );
$$;
REVOKE ALL ON FUNCTION public.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;

-- 3. Admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'news', jsonb_build_object(
      'published', (SELECT count(*) FROM news_posts WHERE status='published'),
      'draft',     (SELECT count(*) FROM news_posts WHERE status='draft')),
    'events', jsonb_build_object(
      'published', (SELECT count(*) FROM events WHERE publish_status='published'),
      'draft',     (SELECT count(*) FROM events WHERE publish_status='draft')),
    'videos', jsonb_build_object(
      'published', (SELECT count(*) FROM videos WHERE status='published'),
      'draft',     (SELECT count(*) FROM videos WHERE status='draft')),
    'library', jsonb_build_object(
      'published', (SELECT count(*) FROM library_items WHERE status='published'),
      'draft',     (SELECT count(*) FROM library_items WHERE status='draft')),
    'live', jsonb_build_object(
      'scheduled', (SELECT count(*) FROM live_streams WHERE status='scheduled'),
      'live',      (SELECT count(*) FROM live_streams WHERE status='live'),
      'completed', (SELECT count(*) FROM live_streams WHERE status='completed')),
    'newsletter', jsonb_build_object(
      'active',       (SELECT count(*) FROM newsletter_subscribers WHERE status='active'),
      'unsubscribed', (SELECT count(*) FROM newsletter_subscribers WHERE status='unsubscribed')),
    'email_24h', jsonb_build_object(
      'success', (SELECT count(*) FROM email_send_log WHERE status='success' AND created_at > now() - interval '24 hours'),
      'error',   (SELECT count(*) FROM email_send_log WHERE status='error'   AND created_at > now() - interval '24 hours')),
    'notification_events', jsonb_build_object(
      'pending',   (SELECT count(*) FROM notification_events WHERE status='pending'),
      'processed', (SELECT count(*) FROM notification_events WHERE status='processed'),
      'failed',    (SELECT count(*) FROM notification_events WHERE status='failed')),
    'requests', jsonb_build_object(
      'fatwa_new',    (SELECT count(*) FROM fatwa_arbitration_requests WHERE status='new'),
      'academy_new',  (SELECT count(*) FROM academy_applications WHERE status='new'),
      'dialogue_new', (SELECT count(*) FROM dialogue_requests WHERE status='new'),
      'research_new', (SELECT count(*) FROM research_submissions WHERE status='new'),
      'contact_new',  (SELECT count(*) FROM contact_messages WHERE status='new'))
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;