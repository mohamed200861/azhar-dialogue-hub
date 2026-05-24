import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Grant = {
  module_key: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
};

/**
 * Module-level permissions on top of the legacy role enum.
 *
 * - super_admin / admin: always allowed (preserves existing behavior).
 * - users with explicit grants: restricted to their granted modules.
 * - editor / media_manager with NO grants: legacy behavior (allow), so
 *   nothing changes for existing accounts until a super_admin assigns
 *   them grants.
 */
export function useModuleAccess() {
  const { user, isAdmin, isSuperAdmin, roles } = useAuth();
  const [grants, setGrants] = useState<Grant[] | null>(null);

  useEffect(() => {
    if (!user) {
      setGrants([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("admin_module_grants")
        .select("module_key, can_read, can_write, can_delete")
        .eq("user_id", user.id);
      setGrants((data ?? []) as Grant[]);
    })();
  }, [user]);

  const isLegacy =
    !isSuperAdmin &&
    !roles.includes("admin") &&
    (grants?.length ?? 0) === 0;

  const can = (moduleKey: string, level: "read" | "write" | "delete" = "read") => {
    if (isSuperAdmin || roles.includes("admin")) return true;
    if (isLegacy) return true; // no grants assigned -> behave like before
    const g = grants?.find((x) => x.module_key === moduleKey);
    if (!g) return false;
    if (level === "read") return g.can_read;
    if (level === "write") return g.can_write;
    return g.can_delete;
  };

  return { can, grants, loading: grants === null, isLegacy, isAdmin, isSuperAdmin };
}
