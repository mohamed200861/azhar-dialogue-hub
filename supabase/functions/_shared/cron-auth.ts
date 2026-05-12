// Shared authorization helper for cron-invoked edge functions.
// Accepts EITHER:
//   - exact match against SUPABASE_SERVICE_ROLE_KEY env (legacy direct call), OR
//   - a JWT whose verified claims contain role === 'service_role' (vault-stored key
//     that may differ from the runtime env value, e.g. after key rotation).
// Returns true if the request is an authorized cron/service caller.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function isAuthorizedServiceCaller(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (SERVICE_KEY && token === SERVICE_KEY) return true;

  // Verify JWT signature and inspect role claim
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data, error } = await client.auth.getClaims(token);
    if (error || !data?.claims) return false;
    return data.claims.role === "service_role";
  } catch {
    return false;
  }
}
