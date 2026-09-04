// TEMPORARY export helper — returns signed URLs for private storage objects.
// Deployed only for the one-off backup export, then deleted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const TOKEN = "kQ7x2Lp9Zt4Vb8Nm3Rw6Ye1Uc5Ha0Sd";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== TOKEN) {
    return new Response("forbidden", { status: 403 });
  }
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const buckets = ["documents", "fatwa-attachments", "research-submissions", "attachments", "membership-attachments"];
  const out: Record<string, string> = {};
  for (const b of buckets) {
    const { data: list } = await admin.storage.from(b).list("", { limit: 1000 });
    const paths: string[] = [];
    for (const e of list ?? []) {
      if (e.id) paths.push(e.name);
      else {
        const { data: sub } = await admin.storage.from(b).list(e.name, { limit: 1000 });
        for (const s of sub ?? []) if (s.id) paths.push(`${e.name}/${s.name}`);
      }
    }
    if (!paths.length) continue;
    const { data: signed } = await admin.storage.from(b).createSignedUrls(paths, 3600);
    for (const s of signed ?? []) if (s.signedUrl) out[`${b}/${s.path}`] = s.signedUrl;
  }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
