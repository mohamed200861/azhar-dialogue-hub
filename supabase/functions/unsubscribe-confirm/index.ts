// unsubscribe-confirm
// Public (verify_jwt = false). Validates an unsubscribe token, marks subscriber
// as 'unsubscribed', marks token as used. Never reveals the underlying email.

import { corsHeaders, getServiceClient } from "../_shared/email-sender.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { token?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = (body.token ?? "").trim();
  if (!token || token.length < 32 || token.length > 128 || !/^[a-f0-9]+$/i.test(token)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid token" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const { data: tk, error } = await supabase
    .from("email_unsubscribe_tokens").select("id,email,used_at").eq("token", token).maybeSingle();

  if (error || !tk) {
    return new Response(JSON.stringify({ ok: false, error: "Token not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // already used → still report success (idempotent UX) but don't act
  if (!tk.used_at) {
    await supabase.from("newsletter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("email", tk.email);
    await supabase.from("email_unsubscribe_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tk.id);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
