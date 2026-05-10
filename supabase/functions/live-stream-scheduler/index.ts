// live-stream-scheduler
// Cron every minute. Finds scheduled live streams starting in next 15 min
// and creates a 'live_starting' notification_event (idempotent via UNIQUE).

import { corsHeaders, getServiceClient } from "../_shared/email-sender.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") ?? "";
  const isService = auth.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "___nope___");
  if (!isService) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const now = new Date();
  const in15 = new Date(now.getTime() + 15 * 60 * 1000);

  const { data: live, error } = await supabase
    .from("live_streams")
    .select("id,title,description,slug,scheduled_at,notify_subscribers,status")
    .eq("status", "scheduled")
    .eq("notify_subscribers", true)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", in15.toISOString())
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let created = 0;
  for (const l of live ?? []) {
    const { error: insErr } = await supabase.from("notification_events").insert({
      entity_type: "live",
      entity_id: l.id,
      event_kind: "live_starting",
      title: l.title,
      summary: l.description,
      url: `/live/${l.slug ?? l.id}`,
      metadata: { scheduled_at: l.scheduled_at },
    });
    // 23505 = unique violation = already created → ok
    if (!insErr || insErr.code === "23505") {
      if (!insErr) created++;
    }
  }

  return new Response(JSON.stringify({ scanned: live?.length ?? 0, created }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
