REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_publish() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_live_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_super_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_module_access(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;