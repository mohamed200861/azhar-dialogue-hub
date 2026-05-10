// create-admin-user
// Server-side admin user creation. Bypasses public signup restrictions.
// Only callable by super_admin. Uses SERVICE_ROLE_KEY (server only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["super_admin", "admin", "editor", "media_manager"] as const;

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
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is super_admin
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isSuper = (callerRoles ?? []).some((r: any) => r.role === "super_admin");
    if (!isSuper) return json(403, { error: "Solo i super_admin possono creare nuovi admin." });

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "");
    const displayName = body?.display_name ? String(body.display_name) : email;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: "Email non valida." });
    if (password.length < 8) return json(400, { error: "La password deve avere almeno 8 caratteri." });
    if (!ALLOWED_ROLES.includes(role as any)) return json(400, { error: "Ruolo non valido." });

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    let newUserId: string | undefined = created?.user?.id;

    if (createErr || !newUserId) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists") || msg.includes("duplicate")) {
        // Look up existing user by email through admin_users table or listUsers
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);
        if (!existing) return json(409, { error: "Email già registrata ma utente non trovato." });
        newUserId = existing.id;
      } else {
        return json(400, { error: createErr?.message || "Errore creazione utente." });
      }
    }

    // Upsert admin_users
    await admin.from("admin_users").upsert(
      { user_id: newUserId, email, display_name: displayName, is_active: true },
      { onConflict: "user_id" },
    );

    // Replace roles for this user with the requested role
    await admin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: newUserId, role: role as any });
    if (roleErr) return json(400, { error: `Ruolo non assegnato: ${roleErr.message}` });

    // Audit
    await admin.from("audit_logs").insert({
      admin_user_id: callerId,
      action: "admin_user_created",
      entity_type: "admin_users",
      entity_id: newUserId,
      metadata: { email, role },
    });

    return json(200, { ok: true, user_id: newUserId });
  } catch (e: any) {
    console.error("create-admin-user error:", e);
    return json(500, { error: "Errore interno." });
  }
});
