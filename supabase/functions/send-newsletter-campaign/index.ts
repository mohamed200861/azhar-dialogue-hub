// send-newsletter-campaign
// Sicuro: accessibile solo a admin/super_admin.
// Non invia email finché RESEND_API_KEY non è configurato.
// La RESEND_API_KEY non è MAI esposta al frontend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) return json(401, { error: "Unauthorized" });
    const userId = claimsData.claims.sub as string;

    // Authorization: must be admin or super_admin
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!allowed) return json(403, { error: "Forbidden" });

    const body = await req.json().catch(() => ({}));
    const campaignId = String(body?.campaign_id ?? "");
    if (!campaignId) return json(400, { error: "campaign_id required" });

    // Load campaign
    const { data: campaign, error: cErr } = await admin
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();
    if (cErr || !campaign) return json(404, { error: "Campaign not found" });

    // Idempotency: prevent double-send
    if (campaign.status === "sent") {
      return json(409, { error: "Campaign already sent" });
    }

    // Email settings
    const { data: settingsRows } = await admin
      .from("site_settings")
      .select("key,value")
      .in("key", ["newsletter_sender_email", "admin_notification_email"]);
    const settings: Record<string, string> = {};
    (settingsRows ?? []).forEach((r: any) => {
      const v = r.value?.value ?? r.value;
      if (v) settings[r.key] = String(v);
    });
    const senderEmail = settings.newsletter_sender_email || "newsletter@alazharscholarunion.it";
    const adminEmail = settings.admin_notification_email || "info@alazharscholarunion.it";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return json(503, {
        error: "Email service not configured",
        message:
          "Servizio email non ancora configurato. Aggiungi RESEND_API_KEY per attivare l'invio reale.",
        sender: senderEmail,
        admin_notify: adminEmail,
      });
    }

    // Mark sending to lock against double execution
    const { error: lockErr } = await admin
      .from("newsletter_campaigns")
      .update({ status: "sent" })
      .eq("id", campaignId)
      .eq("status", campaign.status);
    if (lockErr) return json(409, { error: "Could not lock campaign for send" });

    // Load active subscribers
    const { data: subs } = await admin
      .from("newsletter_subscribers")
      .select("email,status")
      .eq("status", "active");

    const recipients = (subs ?? []).map((s: any) => s.email).filter(Boolean);
    let sent = 0;
    const failures: { email: string; error: string }[] = [];

    for (const to of recipients) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `Al-Azhar Scholars Union <${senderEmail}>`,
            to: [to],
            reply_to: senderEmail,
            subject: campaign.title,
            html: `<div dir="rtl">${campaign.content || ""}</div>`,
          }),
        });
        if (!resp.ok) {
          const t = await resp.text();
          failures.push({ email: to, error: `${resp.status}: ${t.slice(0, 200)}` });
        } else {
          sent++;
        }
      } catch (e: any) {
        failures.push({ email: to, error: e?.message ?? "send failed" });
      }
    }

    // Audit log
    await admin.from("audit_logs").insert({
      admin_user_id: userId,
      action: "newsletter_campaign_sent",
      entity_type: "newsletter_campaigns",
      entity_id: campaignId,
      metadata: { sent, failed: failures.length, sender: senderEmail },
    });

    // Send error report to admin
    if (failures.length && RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `Al-Azhar Scholars Union <${senderEmail}>`,
            to: [adminEmail],
            subject: `Newsletter "${campaign.title}" — ${failures.length} errori`,
            html: `<pre>${JSON.stringify(failures, null, 2)}</pre>`,
          }),
        });
      } catch (_e) {
        // ignore
      }
    }

    return json(200, { ok: true, sent, failed: failures.length });
  } catch (e: any) {
    console.error("send-newsletter-campaign error:", e);
    return json(500, { error: "Internal error" });
  }
});
