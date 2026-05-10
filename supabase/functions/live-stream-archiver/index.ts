// live-stream-archiver
// Cron every 5 min. Hides live streams whose expires_at has passed.
// Uses hide_from_homepage / hide_from_videos flags. Idempotent.

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
  const nowIso = new Date().toISOString();

  const { data: stale, error } = await supabase
    .from("live_streams")
    .select("id")
    .eq("auto_archive", true)
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso)
    .or("hide_from_homepage.eq.false,hide_from_videos.eq.false")
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let archived = 0;
  for (const s of stale ?? []) {
    const { error: upErr } = await supabase.from("live_streams").update({
      hide_from_homepage: true,
      hide_from_videos: true,
    }).eq("id", s.id);
    if (!upErr) archived++;
  }

  return new Response(JSON.stringify({ archived }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
