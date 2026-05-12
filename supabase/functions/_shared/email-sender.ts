// Shared email-sending helper used by all notification/transactional functions.
// - Uses Lovable connector gateway when available (LOVABLE_API_KEY + RESEND_API_KEY).
// - Falls back to direct Resend API if only RESEND_API_KEY is set.
// - If RESEND_API_KEY is missing, returns { configured: false } and never throws.
// - Always logs to email_send_log via the provided service-role client.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const NEWSLETTER_SENDER = "Al Azhar Scholar Union <newsletter@alazharscholarunion.it>";
export const ADMIN_NOTIFY_EMAIL = "info@alazharscholarunion.it";
export const SITE_URL_PUBLIC = Deno.env.get("SITE_URL") ?? "https://alazharscholarunion.it";
export const LOGO_URL = `${SITE_URL_PUBLIC}/logo-email.png`;
export const LOGO_FALLBACK_URL = `${SITE_URL_PUBLIC}/og-image.png`;

/** Renders a centered logo header for HTML emails. RTL-friendly. */
export function emailLogoHeader(opts: { bg?: string; subtitle?: string } = {}): string {
  const bg = opts.bg ?? "#ffffff";
  const sub = opts.subtitle
    ? `<div style="margin-top:10px;font-size:13px;color:#0f3a2e;font-weight:600;">${opts.subtitle}</div>`
    : "";
  return `<tr><td align="center" style="background:${bg};padding:22px 16px 12px 16px;">
  <img src="${LOGO_URL}" alt="اتحاد علماء الأزهر" width="140"
    style="display:block;max-width:140px;width:140px;height:auto;border:0;outline:none;"
    onerror="this.onerror=null;this.src='${LOGO_FALLBACK_URL}';" />
  ${sub}
</td></tr>`;
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  configured: boolean;
  ok: boolean;
  message_id?: string;
  error?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return { configured: false, ok: false, error: "RESEND_API_KEY not configured" };
  }
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const useGateway = !!LOVABLE_API_KEY;
  const url = useGateway
    ? "https://connector-gateway.lovable.dev/resend/emails"
    : "https://api.resend.com/emails";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: useGateway ? `Bearer ${LOVABLE_API_KEY}` : `Bearer ${RESEND_API_KEY}`,
  };
  if (useGateway) headers["X-Connection-Api-Key"] = RESEND_API_KEY;

  const body = {
    from: args.from ?? NEWSLETTER_SENDER,
    to: [args.to],
    subject: args.subject,
    html: args.html,
    reply_to: args.reply_to,
    tags: args.tags,
  };

  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const txt = await res.text();
    if (!res.ok) {
      return { configured: true, ok: false, error: `Resend ${res.status}: ${txt.slice(0, 500)}` };
    }
    let id: string | undefined;
    try { id = JSON.parse(txt)?.id; } catch { /* noop */ }
    return { configured: true, ok: true, message_id: id };
  } catch (e) {
    return { configured: true, ok: false, error: String((e as Error)?.message ?? e) };
  }
}

export async function logSend(
  supabase: SupabaseClient,
  template_name: string,
  recipient_email: string,
  result: SendEmailResult,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from("email_send_log").insert({
    template_name,
    recipient_email,
    status: result.ok ? "success" : "error",
    message_id: result.message_id ?? null,
    error_message: result.ok ? null : (result.error ?? "unknown"),
    metadata,
  });
}

// Suppression check
export async function isSuppressed(supabase: SupabaseClient, email: string): Promise<boolean> {
  const { data } = await supabase
    .from("suppressed_emails").select("id").eq("email", email.toLowerCase()).limit(1).maybeSingle();
  return !!data;
}

// Unsubscribe token issuance
export async function getOrCreateUnsubToken(supabase: SupabaseClient, email: string): Promise<string> {
  const lower = email.toLowerCase();
  const { data: existing } = await supabase
    .from("email_unsubscribe_tokens").select("token").eq("email", lower).is("used_at", null).limit(1).maybeSingle();
  if (existing?.token) return existing.token as string;
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await supabase.from("email_unsubscribe_tokens").insert({ email: lower, token });
  return token;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
