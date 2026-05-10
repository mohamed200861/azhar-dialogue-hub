
-- Performance indexes (idempotent - safe to re-run)
-- Goal: improve common public-list and admin-list query patterns.

-- news_posts: public list, admin filtering
CREATE INDEX IF NOT EXISTS idx_news_posts_status_pub ON public.news_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON public.news_posts (category);
CREATE INDEX IF NOT EXISTS idx_news_posts_featured ON public.news_posts (is_featured) WHERE is_featured = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_posts_slug ON public.news_posts (slug);

-- newsletter_subscribers: lookup by email (case-insensitive), filter by status
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subs_email_lower ON public.newsletter_subscribers (lower(email));
CREATE INDEX IF NOT EXISTS idx_newsletter_subs_status ON public.newsletter_subscribers (status);

-- newsletter_campaigns: admin list ordered by created_at, status filter
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status_created ON public.newsletter_campaigns (status, created_at DESC);

-- academy_programs: public list ordering
CREATE INDEX IF NOT EXISTS idx_academy_programs_pub_order ON public.academy_programs (publish_status, display_order, created_at DESC);

-- academy_applications: admin list and status filter
CREATE INDEX IF NOT EXISTS idx_academy_apps_status_created ON public.academy_applications (status, created_at DESC);

-- dialogue_initiatives
CREATE INDEX IF NOT EXISTS idx_dialogue_initiatives_pub_order ON public.dialogue_initiatives (publish_status, display_order, initiative_date DESC NULLS LAST);

-- dialogue_requests
CREATE INDEX IF NOT EXISTS idx_dialogue_requests_status_created ON public.dialogue_requests (status, created_at DESC);

-- research_items
CREATE INDEX IF NOT EXISTS idx_research_items_pub_order ON public.research_items (publish_status, display_order, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_research_items_category ON public.research_items (category);

-- research_submissions
CREATE INDEX IF NOT EXISTS idx_research_submissions_status_created ON public.research_submissions (status, created_at DESC);

-- fatwa_arbitration_requests
CREATE INDEX IF NOT EXISTS idx_fatwa_status_created ON public.fatwa_arbitration_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fatwa_urgent ON public.fatwa_arbitration_requests (is_urgent) WHERE is_urgent = true;

-- videos: public list
CREATE INDEX IF NOT EXISTS idx_videos_status_created ON public.videos (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON public.videos (is_featured) WHERE is_featured = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_slug ON public.videos (slug);

-- contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON public.contact_messages (status, created_at DESC);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs (admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

-- user_roles: ensure unique (user_id, role)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);

-- live_streams: extra useful index for "visible" filter
CREATE INDEX IF NOT EXISTS idx_live_streams_homepage ON public.live_streams (show_on_homepage, status, scheduled_at) WHERE hide_from_homepage = false;

-- site_pages: lookup by page_key and slug
CREATE INDEX IF NOT EXISTS idx_site_pages_key ON public.site_pages (page_key);
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON public.site_pages (slug);

-- events: status + start
CREATE INDEX IF NOT EXISTS idx_events_publish_start ON public.events (publish_status, start_datetime DESC);
