// send-form-confirmation
// Public endpoint (verify_jwt = false in config.toml). Called fire-and-forget by
// public forms after a successful insert. Sends:
//   1) confirmation email (in Arabic) to the requester
//   2) admin alert to ADMIN_NOTIFY_EMAIL
// Never throws on missing RESEND_API_KEY: returns { configured: false } so the
// form UX is never broken. Validates input strictly before sending.

import { corsHeaders, getServiceClient, sendEmail, logSend, NEWSLETTER_SENDER, ADMIN_NOTIFY_EMAIL, emailLogoHeader } from "../_shared/email-sender.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://alazharscholarunion.it";

type FormType = "contact" | "fatwa" | "academy" | "dialogue" | "research" | "newsletter";

const ALLOWED: Record<FormType, { table: string; admin_path: string; label_ar: string }> = {
  contact:    { table: "contact_messages",            admin_path: "/admin/messages",           label_ar: "رسالة تواصل" },
  fatwa:      { table: "fatwa_arbitration_requests",  admin_path: "/admin/fatwa-requests",     label_ar: "طلب فتوى/تحكيم" },
  academy:    { table: "academy_applications",        admin_path: "/admin/sharia-academy",     label_ar: "طلب التحاق بالأكاديمية" },
  dialogue:   { table: "dialogue_requests",           admin_path: "/admin/civilizational-dialogue", label_ar: "طلب حوار" },
  research:   { table: "research_submissions",        admin_path: "/admin/research-studies",   label_ar: "بحث علمي" },
  newsletter: { table: "newsletter_subscribers",      admin_path: "/admin/newsletter",         label_ar: "اشتراك في النشرة" },
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function userTemplate(opts: { label_ar: string; full_name: string }) {
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;">
<table width="100%" style="background:#f6f7f9;padding:24px 0;"><tr><td align="center">
<table width="600" style="background:#fff;border-radius:8px;overflow:hidden;">
${emailLogoHeader()}
<tr><td style="background:#0f3a2e;padding:16px;text-align:center;color:#fff;font-size:18px;font-weight:bold;">اتحاد علماء الأزهر</td></tr>
<tr><td style="padding:28px;line-height:1.8;">
  <p>السلام عليكم ورحمة الله وبركاته،</p>
  <p>تحية طيبة الأستاذ/الأستاذة <strong>${escapeHtml(opts.full_name)}</strong>،</p>
  <p>نشكر لكم تواصلكم مع اتحاد علماء الأزهر. لقد استلمنا طلبكم بنجاح:</p>
  <p style="background:#f3f4f6;padding:12px 16px;border-radius:6px;font-weight:bold;">${escapeHtml(opts.label_ar)}</p>
  <p>سيقوم الفريق المختص بمراجعة الطلب والرد عليكم في أقرب وقت ممكن إن شاء الله.</p>
  <p style="margin-top:24px;color:#6b7280;font-size:13px;">هذه رسالة آلية، لا حاجة للرد عليها.</p>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #eef0f3;font-size:12px;color:#6b7280;text-align:center;">اتحاد علماء الأزهر — alazharscholarunion.it</td></tr>
</table></td></tr></table></body></html>`;
}

function adminTemplate(opts: { label_ar: string; data: Record<string, unknown>; admin_url: string; record_id: string }) {
  const rows = Object.entries(opts.data).map(([k, v]) =>
    `<tr><td style="padding:6px 12px;color:#6b7280;font-size:12px;">${escapeHtml(k)}</td><td style="padding:6px 12px;">${escapeHtml(String(v ?? "—"))}</td></tr>`
  ).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#111;background:#f6f7f9;padding:20px;">
<table width="640" style="background:#fff;border-radius:6px;margin:0 auto;overflow:hidden;">
${emailLogoHeader()}
<tr><td style="padding:18px 22px;background:#111827;color:#fff;">
  <strong>New ${escapeHtml(opts.label_ar)}</strong>
</td></tr>
<tr><td style="padding:18px 22px;">
  <table cellpadding="0" cellspacing="0" width="100%">${rows}</table>
  <p style="margin-top:18px;"><a href="${escapeHtml(opts.admin_url)}" style="background:#0f3a2e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;">Open in admin</a></p>
  <p style="font-size:12px;color:#6b7280;">Record id: ${escapeHtml(opts.record_id)}</p>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { form_type?: string; record_id?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const ft = body.form_type as FormType;
  const id = body.record_id;
  if (!ft || !id || !ALLOWED[ft] || !/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cfg = ALLOWED[ft];
  const supabase = getServiceClient();
  const { data: rec, error } = await supabase.from(cfg.table).select("*").eq("id", id).maybeSingle();
  if (error || !rec) {
    return new Response(JSON.stringify({ error: "Record not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userEmail = (rec.email as string | undefined)?.toLowerCase() ?? "";
  const fullName = (rec.full_name as string | undefined) ?? (rec.name as string | undefined) ?? userEmail.split("@")[0] ?? "—";

  // 1. user confirmation
  if (userEmail) {
    const result = await sendEmail({
      to: userEmail,
      subject: `تم استلام طلبك — ${cfg.label_ar}`,
      html: userTemplate({ label_ar: cfg.label_ar, full_name: fullName }),
      from: NEWSLETTER_SENDER,
      reply_to: ADMIN_NOTIFY_EMAIL,
    });
    await logSend(supabase, `form_confirmation:${ft}`, userEmail, result, { record_id: id });
  }

  // 2. admin alert
  const adminUrl = `${SITE_URL}${cfg.admin_path}`;
  const adminData = {
    type: cfg.label_ar,
    name: fullName,
    email: userEmail,
    subject: rec.subject ?? rec.title ?? "—",
    created_at: rec.created_at ?? new Date().toISOString(),
  };
  const adminResult = await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `[${ft.toUpperCase()}] New submission from ${fullName}`,
    html: adminTemplate({ label_ar: cfg.label_ar, data: adminData, admin_url: adminUrl, record_id: id }),
    from: NEWSLETTER_SENDER,
    reply_to: userEmail || undefined,
  });
  await logSend(supabase, `admin_alert:${ft}`, ADMIN_NOTIFY_EMAIL, adminResult, { record_id: id });

  return new Response(JSON.stringify({ ok: true, configured: adminResult.configured }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
