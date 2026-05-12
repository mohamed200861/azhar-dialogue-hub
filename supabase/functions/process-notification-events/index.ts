// process-notification-events
// Cron-driven. Reads notification_events with status='pending' and dispatches
// emails to active newsletter subscribers. Idempotent: relies on UNIQUE constraint
// on notification_events and email_send_log de-duplication per (template, event, recipient).

import { corsHeaders, getServiceClient, sendEmail, logSend, isSuppressed, getOrCreateUnsubToken, NEWSLETTER_SENDER, ADMIN_NOTIFY_EMAIL, emailLogoHeader } from "../_shared/email-sender.ts";
import { isAuthorizedServiceCaller } from "../_shared/cron-auth.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://alazharscholarunion.it";
const BATCH_EVENTS = 5;       // events per run
const BATCH_RECIPIENTS = 200; // recipients per event per run

const KIND_LABELS: Record<string, string> = {
  published: "محتوى جديد",
  live_starting: "بث مباشر قريباً",
  live_started: "بدأ البث المباشر",
  live_completed: "تسجيل البث متاح",
};

function buildEmailHtml(opts: { title: string; summary: string | null; url: string; kind: string; unsubUrl: string }) {
  const { title, summary, url, kind, unsubUrl } = opts;
  const heading = KIND_LABELS[kind] ?? "تحديث جديد";
  const link = `${SITE_URL}${url}`;
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)">
${emailLogoHeader({ subtitle: "اتحاد علماء الأزهر" })}
<tr><td style="background:#0f3a2e;padding:18px;text-align:center;color:#fff;">
  <div style="font-size:18px;font-weight:bold;">${escapeHtml(heading)}</div>
</td></tr>
<tr><td style="padding:28px 28px 8px 28px;">
  <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f3a2e;">${escapeHtml(title)}</h2>
  ${summary ? `<p style="margin:0 0 18px 0;line-height:1.7;color:#374151;">${escapeHtml(summary)}</p>` : ""}
  <p style="margin:24px 0;text-align:center;">
    <a href="${escapeAttr(link)}" style="background:#0f3a2e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block;font-weight:bold;">قراءة المزيد</a>
  </p>
</td></tr>
<tr><td style="padding:16px 28px 24px 28px;border-top:1px solid #eef0f3;font-size:12px;color:#6b7280;text-align:center;">
  <div>تلقيت هذه الرسالة لأنك مشترك في النشرة البريدية لاتحاد علماء الأزهر.</div>
  <div style="margin-top:8px;"><a href="${escapeAttr(unsubUrl)}" style="color:#6b7280;text-decoration:underline;">إلغاء الاشتراك</a></div>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function escapeAttr(s: string) { return escapeHtml(s); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Allow service-role (cron) OR admin/super_admin user JWT
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  let authorized = false;
  let authMode = "none";

  if (token && SERVICE_KEY && token === SERVICE_KEY) {
    authorized = true;
    authMode = "service_role";
  } else if (token) {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: `Bearer ${token}` } } },
      );
      const { data: claims } = await userClient.auth.getClaims(token);
      const userId = claims?.claims?.sub;
      if (userId) {
        const svc = getServiceClient();
        const { data: roles } = await svc
          .from("user_roles").select("role").eq("user_id", userId);
        const roleSet = new Set((roles ?? []).map((r: any) => r.role));
        if (roleSet.has("super_admin") || roleSet.has("admin")) {
          authorized = true;
          authMode = "admin_user";
        }
      }
    } catch (_e) { /* fallthrough */ }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Forbidden: admin or super_admin required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const RESEND_OK = !!Deno.env.get("RESEND_API_KEY");

  const { data: events, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_EVENTS);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ processed: 0, skipped: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let processed = 0, failedEvents = 0, totalSent = 0, totalErrors = 0;

  for (const ev of events) {
    // mark processing (best-effort)
    await supabase.from("notification_events").update({ status: "processing" }).eq("id", ev.id);

    if (!RESEND_OK) {
      await supabase.from("notification_events").update({
        status: "failed",
        error_message: "RESEND_API_KEY not configured",
        processed_at: new Date().toISOString(),
      }).eq("id", ev.id);
      failedEvents++;
      continue;
    }

    // fetch active subscribers
    const { data: subs } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("status", "active")
      .limit(BATCH_RECIPIENTS);

    let sent = 0, errors = 0;
    for (const s of subs ?? []) {
      const email = (s.email as string).toLowerCase();
      if (await isSuppressed(supabase, email)) continue;

      // de-dup per (event, email)
      const { data: prev } = await supabase
        .from("email_send_log")
        .select("id")
        .eq("recipient_email", email)
        .eq("template_name", `notification:${ev.event_kind}`)
        .contains("metadata", { event_id: ev.id })
        .limit(1).maybeSingle();
      if (prev) continue;

      const token = await getOrCreateUnsubToken(supabase, email);
      const unsubUrl = `${SITE_URL}/unsubscribe?token=${token}`;
      const html = buildEmailHtml({
        title: ev.title, summary: ev.summary, url: ev.url ?? "/", kind: ev.event_kind, unsubUrl,
      });

      const result = await sendEmail({
        to: email, subject: ev.title, html, from: NEWSLETTER_SENDER,
        tags: [{ name: "kind", value: ev.event_kind }, { name: "event_id", value: ev.id }],
      });
      await logSend(supabase, `notification:${ev.event_kind}`, email, result, {
        event_id: ev.id, entity_type: ev.entity_type, entity_id: ev.entity_id,
      });
      if (result.ok) sent++; else errors++;
    }

    await supabase.from("notification_events").update({
      status: errors > 0 && sent === 0 ? "failed" : "processed",
      processed_at: new Date().toISOString(),
      error_message: errors > 0 && sent === 0 ? "All recipients failed" : null,
      metadata: { ...(ev.metadata ?? {}), sent, errors },
    }).eq("id", ev.id);

    // audit
    await supabase.from("audit_logs").insert({
      action: "notification_event_processed",
      entity_type: ev.entity_type,
      entity_id: ev.entity_id,
      metadata: { event_id: ev.id, kind: ev.event_kind, sent, errors },
    }).then(() => {}, () => {}); // ignore RLS failures (admin_user_id null)

    processed++;
    totalSent += sent;
    totalErrors += errors;
  }

  return new Response(JSON.stringify({ processed, failedEvents, totalSent, totalErrors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
