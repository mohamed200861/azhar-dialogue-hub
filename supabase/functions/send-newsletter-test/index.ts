// send-newsletter-test
// Invia un'anteprima di una campagna a UNA singola email di test.
// Non cambia lo status della campagna. Solo admin/super_admin.
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

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

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

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const allowed = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!allowed) return json(403, { error: "Forbidden" });

    const body = await req.json().catch(() => ({}));
    const campaignId = String(body?.campaign_id ?? "").trim();
    const testEmail = String(body?.test_email ?? "").trim();
    const adhocSubject = body?.subject ? String(body.subject) : null;
    const adhocHtml = body?.html ? String(body.html) : null;
    if (!isEmail(testEmail)) return json(400, { error: "test_email non valido" });

    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://alazharscholarunion.it";
    const LOGO_URL = `${SITE_URL}/logo-email.png`;
    const LOGO_FB = `${SITE_URL}/og-image.png`;
    const wrapHtml = (innerHtml: string, title: string) => `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;">
<table width="100%" style="background:#f6f7f9;padding:24px 0;"><tr><td align="center">
<table width="600" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
<tr><td align="center" style="background:#fff;padding:22px 16px 12px 16px;">
  <img src="${LOGO_URL}" alt="اتحاد علماء الأزهر" width="140" style="display:block;max-width:140px;width:140px;height:auto;border:0;" onerror="this.onerror=null;this.src='${LOGO_FB}';" />
</td></tr>
<tr><td style="background:#0f3a2e;padding:14px;text-align:center;color:#fff;font-size:16px;font-weight:bold;">اتحاد علماء الأزهر</td></tr>
<tr><td style="padding:24px 28px;line-height:1.8;" dir="rtl">${innerHtml}</td></tr>
<tr><td style="padding:14px 28px;border-top:1px solid #eef0f3;font-size:12px;color:#6b7280;text-align:center;">اتحاد علماء الأزهر — alazharscholarunion.it</td></tr>
</table></td></tr></table></body></html>`;

    let subject = "";
    let html = "";
    let entityId: string | null = null;
    if (campaignId) {
      const { data: campaign, error: cErr } = await admin
        .from("newsletter_campaigns").select("*").eq("id", campaignId).maybeSingle();
      if (cErr || !campaign) return json(404, { error: "Campaign not found" });
      subject = `[TEST] ${campaign.title}`;
      html = wrapHtml(campaign.content || "", campaign.title);
      entityId = campaignId;
    } else if (adhocSubject && adhocHtml) {
      subject = `[TEST] ${adhocSubject}`;
      html = wrapHtml(adhocHtml, adhocSubject);
    } else {
      return json(400, { error: "campaign_id or (subject+html) required" });
    }

    const { data: settingsRows } = await admin
      .from("site_settings").select("key,value")
      .in("key", ["newsletter_sender_email", "admin_notification_email"]);
    const settings: Record<string, string> = {};
    (settingsRows ?? []).forEach((r: any) => {
      const v = r.value?.value ?? r.value;
      if (v) settings[r.key] = String(v);
    });
    const senderEmail = settings.newsletter_sender_email || "newsletter@alazharscholarunion.it";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return json(503, {
        error: "Email service not configured",
        message:
          "Servizio email non ancora configurato. Aggiungi RESEND_API_KEY per attivare l'invio reale.",
      });
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `Al-Azhar Scholars Union <${senderEmail}>`,
        to: [testEmail], reply_to: senderEmail, subject, html,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return json(502, { error: `Resend error ${resp.status}: ${t.slice(0, 300)}` });
    }

    await admin.from("audit_logs").insert({
      admin_user_id: userId,
      action: "newsletter_test_sent",
      entity_type: "newsletter_campaigns",
      entity_id: entityId,
      metadata: { to: testEmail, sender: senderEmail, adhoc: !entityId },
    });

    return json(200, { ok: true, to: testEmail });
  } catch (e: any) {
    console.error("send-newsletter-test error:", e);
    return json(500, { error: "Internal error" });
  }
});
