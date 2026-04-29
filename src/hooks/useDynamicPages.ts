import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DynamicPage = {
  id: string;
  page_key: string;
  title: string;
  subtitle: string | null;
  intro: string | null;
  cover_image: string | null;
  slug: string;
  content: string;
  seo_title: string;
  seo_description: string;
  status: "draft" | "published" | "archived";
  show_in_header: boolean;
  show_in_footer: boolean;
  display_order: number;
  sections: Record<string, any> | null;
};

const pagesCache = new Map<string, DynamicPage | null>();
const subscribers = new Map<string, Set<(p: DynamicPage | null) => void>>();
let realtimeSetup = false;

function notify(pageKey: string, page: DynamicPage | null) {
  pagesCache.set(pageKey, page);
  subscribers.get(pageKey)?.forEach((cb) => cb(page));
}

function ensureRealtime() {
  if (realtimeSetup) return;
  realtimeSetup = true;
  supabase
    .channel("site_pages_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_pages" }, async (payload: any) => {
      const row = (payload.new ?? payload.old) as DynamicPage | undefined;
      if (!row?.page_key) return;
      // re-fetch fresh to ensure consistent shape
      const { data } = await supabase.from("site_pages").select("*").eq("page_key", row.page_key).maybeSingle();
      notify(row.page_key, (data as DynamicPage) ?? null);
    })
    .subscribe();
}

export function useDynamicPage(pageKey: string) {
  const [page, setPage] = useState<DynamicPage | null>(pagesCache.get(pageKey) ?? null);
  const [loaded, setLoaded] = useState(pagesCache.has(pageKey));

  useEffect(() => {
    ensureRealtime();
    let alive = true;
    if (!subscribers.has(pageKey)) subscribers.set(pageKey, new Set());
    const cb = (p: DynamicPage | null) => {
      if (!alive) return;
      setPage(p);
      setLoaded(true);
    };
    subscribers.get(pageKey)!.add(cb);

    (async () => {
      const { data } = await supabase.from("site_pages").select("*").eq("page_key", pageKey).maybeSingle();
      if (!alive) return;
      notify(pageKey, (data as DynamicPage) ?? null);
    })();

    return () => {
      alive = false;
      subscribers.get(pageKey)?.delete(cb);
    };
  }, [pageKey]);

  return { page, loaded };
}

export function clearPagesCache() {
  pagesCache.clear();
}
