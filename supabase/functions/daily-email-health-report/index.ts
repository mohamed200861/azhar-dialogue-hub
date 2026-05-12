// daily-email-health-report
// Cron once per day. Counts errors in last 24h from email_send_log and pending/failed
// notification_events. Sends a single summary email to ADMIN_NOTIFY_EMAIL.
// Anti-spam: skips if an alert of the same kind was already sent in last 20 hours.

import { corsHeaders, getServiceClient, sendEmail, logSend, ADMIN_NOTIFY_EMAIL, NEWSLETTER_SENDER, LOGO_URL, LOGO_FALLBACK_URL } from "../_shared/email-sender.ts";
import { isAuthorizedServiceCaller } from "../_shared/cron-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!(await isAuthorizedServiceCaller(req))) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { count: errorsCount } = await supabase
    .from("email_send_log").select("id", { count: "exact", head: true })
    .eq("status", "error").gte("created_at", since);

  const { count: failedEventsCount } = await supabase
    .from("notification_events").select("id", { count: "exact", head: true })
    .eq("status", "failed").gte("created_at", since);

  const { count: pendingEventsCount } = await supabase
    .from("notification_events").select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const totalIssues = (errorsCount ?? 0) + (failedEventsCount ?? 0);
  if (totalIssues === 0) {
    return new Response(JSON.stringify({ skipped: true, reason: "no issues" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // anti-spam: only one report per 20h
  const dedupeSince = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("email_alert_log").select("id")
    .eq("alert_kind", "daily_email_health").gte("sent_at", dedupeSince).limit(1).maybeSingle();
  if (recent) {
    return new Response(JSON.stringify({ skipped: true, reason: "already sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#111;background:#f6f7f9;padding:20px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="text-align:center;padding:18px;"><img src="${LOGO_URL}" alt="logo" width="120" style="max-width:120px;height:auto;" onerror="this.onerror=null;this.src='${LOGO_FALLBACK_URL}';" /></div>
    <div style="padding:0 24px 24px 24px;">
      <h2 style="margin:0 0 12px 0;">Daily email health report</h2>
      <ul style="line-height:1.8;">
        <li>Email errors (24h): <strong>${errorsCount ?? 0}</strong></li>
        <li>Failed notification events (24h): <strong>${failedEventsCount ?? 0}</strong></li>
        <li>Pending notification events: <strong>${pendingEventsCount ?? 0}</strong></li>
      </ul>
      <p>Apri <a href="https://alazharscholarunion.it/admin/newsletter">/admin/newsletter</a> → tab "سجل الإرسال" / "الأحداث التلقائية" per i dettagli.</p>
    </div>
  </div>
  </body></html>`;

  const result = await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `[Health] ${totalIssues} email issue(s) in last 24h`,
    html,
    from: NEWSLETTER_SENDER,
  });
  await logSend(supabase, "daily_email_health", ADMIN_NOTIFY_EMAIL, result, {
    errors: errorsCount, failed_events: failedEventsCount, pending_events: pendingEventsCount,
  });

  if (result.ok || result.configured === false) {
    await supabase.from("email_alert_log").insert({
      alert_kind: "daily_email_health",
      metadata: { errors: errorsCount, failed_events: failedEventsCount, pending_events: pendingEventsCount },
    });
  }

  return new Response(JSON.stringify({ sent: result.ok, configured: result.configured }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
