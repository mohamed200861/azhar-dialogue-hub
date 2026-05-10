-- =========================================================
-- Notification events: hub centrale per tutte le notifiche
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.notification_event_status AS ENUM ('pending','processing','processed','failed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  status public.notification_event_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UNIQUE per evitare doppi eventi sullo stesso contenuto/tipo
CREATE UNIQUE INDEX IF NOT EXISTS notification_events_unique_kind_idx
  ON public.notification_events (entity_type, entity_id, event_kind)
  WHERE entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS notification_events_status_created_idx
  ON public.notification_events (status, created_at);
CREATE INDEX IF NOT EXISTS notification_events_entity_idx
  ON public.notification_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS notification_events_kind_idx
  ON public.notification_events (event_kind);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read notification events" ON public.notification_events;
CREATE POLICY "Admins read notification events"
  ON public.notification_events FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update notification events" ON public.notification_events;
CREATE POLICY "Admins update notification events"
  ON public.notification_events FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role manages notification events" ON public.notification_events;
CREATE POLICY "Service role manages notification events"
  ON public.notification_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS notification_events_touch ON public.notification_events;
CREATE TRIGGER notification_events_touch
  BEFORE UPDATE ON public.notification_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

REVOKE ALL ON public.notification_events FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.notification_events TO authenticated;

-- =========================================================
-- Email alert log: anti-spam per alert giornalieri
-- =========================================================
CREATE TABLE IF NOT EXISTS public.email_alert_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_kind TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS email_alert_log_kind_sent_idx
  ON public.email_alert_log (alert_kind, sent_at DESC);

ALTER TABLE public.email_alert_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read email alert log" ON public.email_alert_log;
CREATE POLICY "Admins read email alert log"
  ON public.email_alert_log FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role manages email alert log" ON public.email_alert_log;
CREATE POLICY "Service role manages email alert log"
  ON public.email_alert_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

REVOKE ALL ON public.email_alert_log FROM anon, authenticated;
GRANT SELECT ON public.email_alert_log TO authenticated;

-- =========================================================
-- Trigger generico per pubblicazione contenuti
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type TEXT;
  v_url TEXT;
  v_title TEXT;
  v_summary TEXT;
  v_status TEXT;
  v_old_status TEXT;
BEGIN
  v_entity_type := TG_ARGV[0];

  -- determina il valore status corrente e precedente in base alla tabella
  IF TG_TABLE_NAME IN ('news_posts','library_items','videos') THEN
    v_status := NEW.status::text;
    v_old_status := COALESCE(OLD.status::text, '');
  ELSE
    v_status := NEW.publish_status::text;
    v_old_status := COALESCE(OLD.publish_status::text, '');
  END IF;

  -- triggera solo se diventa published (nuovo o transizione)
  IF v_status <> 'published' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND v_old_status = 'published' THEN RETURN NEW; END IF;

  v_title := NEW.title;
  v_summary := COALESCE(
    NULLIF(BTRIM(COALESCE(NULLIF((to_jsonb(NEW)->>'excerpt'),''), NULLIF((to_jsonb(NEW)->>'description'),''), NULLIF((to_jsonb(NEW)->>'abstract'),''), '')), '')
  );

  v_url := CASE v_entity_type
    WHEN 'news'     THEN '/news/' || COALESCE(NEW.slug, NEW.id::text)
    WHEN 'event'    THEN '/events/' || COALESCE(NEW.slug, NEW.id::text)
    WHEN 'library'  THEN '/library/' || COALESCE(NEW.slug, NEW.id::text)
    WHEN 'video'    THEN '/videos/' || COALESCE(NEW.slug, NEW.id::text)
    WHEN 'research' THEN '/research-studies'
    WHEN 'academy'  THEN '/sharia-academy'
    WHEN 'dialogue' THEN '/civilizational-dialogue'
    ELSE '/'
  END;

  INSERT INTO public.notification_events (entity_type, entity_id, event_kind, title, summary, url, metadata)
  VALUES (v_entity_type, NEW.id, 'published', v_title, v_summary, v_url,
          jsonb_build_object('table', TG_TABLE_NAME))
  ON CONFLICT (entity_type, entity_id, event_kind) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- non bloccare mai la pubblicazione per errori notifica
  RETURN NEW;
END;
$$;

-- attacca trigger alle tabelle (drop+create idempotente)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('news_posts','news'),
      ('events','event'),
      ('library_items','library'),
      ('videos','video'),
      ('research_items','research'),
      ('academy_programs','academy'),
      ('dialogue_initiatives','dialogue')
    ) AS t(tbl, etype)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS notify_publish_trg ON public.%I', rec.tbl);
    EXECUTE format(
      'CREATE TRIGGER notify_publish_trg AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish(%L)',
      rec.tbl, rec.etype
    );
  END LOOP;
END $$;

-- =========================================================
-- Trigger live streams: started / completed
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_on_live_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_url TEXT;
BEGIN
  v_url := '/live/' || COALESCE(NEW.slug, NEW.id::text);

  IF NEW.status = 'live' AND (OLD.status IS DISTINCT FROM 'live') AND COALESCE(NEW.notify_subscribers, false) THEN
    INSERT INTO public.notification_events (entity_type, entity_id, event_kind, title, summary, url, metadata)
    VALUES ('live', NEW.id, 'live_started', NEW.title, NEW.description, v_url, jsonb_build_object('platform', NEW.platform))
    ON CONFLICT (entity_type, entity_id, event_kind) DO NOTHING;
  END IF;

  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.replay_url IS NOT NULL THEN
    INSERT INTO public.notification_events (entity_type, entity_id, event_kind, title, summary, url, metadata)
    VALUES ('live', NEW.id, 'live_completed', NEW.title, NEW.description, v_url, jsonb_build_object('replay_url', NEW.replay_url))
    ON CONFLICT (entity_type, entity_id, event_kind) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_live_change_trg ON public.live_streams;
CREATE TRIGGER notify_live_change_trg
  AFTER UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_live_change();

-- =========================================================
-- Indici aggiuntivi performance
-- =========================================================
CREATE INDEX IF NOT EXISTS live_streams_status_scheduled_idx
  ON public.live_streams (status, scheduled_at);
CREATE INDEX IF NOT EXISTS live_streams_expires_idx
  ON public.live_streams (expires_at) WHERE auto_archive = true;
CREATE INDEX IF NOT EXISTS email_send_log_template_idx
  ON public.email_send_log (template_name, created_at DESC);
CREATE INDEX IF NOT EXISTS email_send_log_status_idx
  ON public.email_send_log (status, created_at DESC);

-- Lockdown EXECUTE su funzioni di notifica
REVOKE EXECUTE ON FUNCTION public.notify_on_publish() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_live_change() FROM anon, authenticated;