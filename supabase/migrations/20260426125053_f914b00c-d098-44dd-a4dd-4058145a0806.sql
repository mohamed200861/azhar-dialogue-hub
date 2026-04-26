-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'editor', 'media_manager');
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.live_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE public.video_type AS ENUM ('video', 'live', 'recording');
CREATE TYPE public.event_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');
CREATE TYPE public.message_status AS ENUM ('new', 'read', 'replied', 'archived', 'spam');

-- =========================================================
-- USER ROLES (separate table — never on profiles)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','editor','media_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_publish(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','editor')
  )
$$;

-- user_roles policies: only super_admin can manage
CREATE POLICY "Super admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =========================================================
-- ADMIN USERS (internal staff metadata)
-- =========================================================
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view admin users"
  ON public.admin_users FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins manage admin users"
  ON public.admin_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Auto-create admin_users row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_users (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- SITE SETTINGS
-- =========================================================
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read settings"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- NEWS POSTS
-- =========================================================
CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  category TEXT NOT NULL,
  publisher_source TEXT NOT NULL DEFAULT 'إدارة الاتحاد',
  pdf_attachment TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  status content_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  keywords TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER news_posts_touch BEFORE UPDATE ON public.news_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX news_posts_status_idx ON public.news_posts (status, published_at DESC);
CREATE INDEX news_posts_category_idx ON public.news_posts (category);

CREATE POLICY "Public reads published news"
  ON public.news_posts FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Admins read all news"
  ON public.news_posts FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Editors create news"
  ON public.news_posts FOR INSERT TO authenticated
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Editors update news"
  ON public.news_posts FOR UPDATE TO authenticated
  USING (public.can_publish(auth.uid()))
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Admins delete news"
  ON public.news_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- LIBRARY ITEMS
-- =========================================================
CREATE TABLE public.library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  cover_image TEXT,
  file_url TEXT,
  external_url TEXT,
  language TEXT DEFAULT 'العربية',
  pages_count INTEGER,
  publisher_source TEXT NOT NULL DEFAULT 'إدارة الاتحاد',
  downloads_count INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER library_items_touch BEFORE UPDATE ON public.library_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX library_items_status_idx ON public.library_items (status, published_at DESC);

CREATE POLICY "Public reads published library"
  ON public.library_items FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Admins read all library"
  ON public.library_items FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Editors create library"
  ON public.library_items FOR INSERT TO authenticated
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Editors update library"
  ON public.library_items FOR UPDATE TO authenticated
  USING (public.can_publish(auth.uid()))
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Admins delete library"
  ON public.library_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- VIDEOS / LIVE
-- =========================================================
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail TEXT,
  video_url TEXT,
  embed_url TEXT,
  platform TEXT,
  type video_type NOT NULL DEFAULT 'video',
  live_status live_status,
  scheduled_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  category TEXT NOT NULL,
  publisher_source TEXT NOT NULL DEFAULT 'القسم الإعلامي',
  status content_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER videos_touch BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX videos_status_idx ON public.videos (status, scheduled_at DESC);

CREATE POLICY "Public reads published videos"
  ON public.videos FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Admins read all videos"
  ON public.videos FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Editors create videos"
  ON public.videos FOR INSERT TO authenticated
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Editors update videos"
  ON public.videos FOR UPDATE TO authenticated
  USING (public.can_publish(auth.uid()))
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Admins delete videos"
  ON public.videos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- EVENTS
-- =========================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  event_type TEXT NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  location TEXT,
  online_link TEXT,
  registration_link TEXT,
  live_link TEXT,
  replay_link TEXT,
  organizer_source TEXT NOT NULL DEFAULT 'إدارة الاتحاد',
  status event_status NOT NULL DEFAULT 'upcoming',
  publish_status content_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX events_start_idx ON public.events (start_datetime DESC);

CREATE POLICY "Public reads published events"
  ON public.events FOR SELECT TO anon, authenticated
  USING (publish_status = 'published');
CREATE POLICY "Admins read all events"
  ON public.events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Editors create events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Editors update events"
  ON public.events FOR UPDATE TO authenticated
  USING (public.can_publish(auth.uid()))
  WITH CHECK (public.can_publish(auth.uid()));
CREATE POLICY "Admins delete events"
  ON public.events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- MEDIA FILES
-- =========================================================
CREATE TABLE public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  folder TEXT NOT NULL DEFAULT 'images',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read media"
  ON public.media_files FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert media"
  ON public.media_files FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete media"
  ON public.media_files FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- =========================================================
-- CONTACT MESSAGES
-- =========================================================
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  contact_type TEXT,
  status message_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact"
  ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admins read messages"
  ON public.contact_messages FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update messages"
  ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete messages"
  ON public.contact_messages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- NEWSLETTER
-- =========================================================
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone subscribes"
  ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admins read subscribers"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete subscribers"
  ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- AUDIT LOGS
-- =========================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Authenticated insert logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (admin_user_id = auth.uid());

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('images', 'images', true),
  ('covers', 'covers', true),
  ('documents', 'documents', true),
  ('thumbnails', 'thumbnails', true),
  ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for all 5 buckets
CREATE POLICY "Public read storage"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('images','covers','documents','thumbnails','attachments'));

-- Admin write/update/delete
CREATE POLICY "Admins upload storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('images','covers','documents','thumbnails','attachments')
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins update storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('images','covers','documents','thumbnails','attachments')
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins delete storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('images','covers','documents','thumbnails','attachments')
    AND public.is_admin(auth.uid())
  );