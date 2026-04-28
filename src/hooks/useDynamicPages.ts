import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DynamicPage = {
  id: string;
  page_key: string;
  title: string;
  slug: string;
  content: string;
  seo_title: string;
  seo_description: string;
  status: "draft" | "published" | "archived";
  show_in_header: boolean;
  show_in_footer: boolean;
  display_order: number;
};

export type VisibilityRow = {
  key: string;
  label: string;
  type: "page" | "section";
  is_visible: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  display_order: number;
};

let pagesCache: DynamicPage[] | null = null;
let visibilityCache: VisibilityRow[] | null = null;

export function useDynamicPage(pageKey: string) {
  const [page, setPage] = useState<DynamicPage | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_pages").select("*").eq("page_key", pageKey).maybeSingle();
      setPage((data as DynamicPage) ?? null);
      setLoaded(true);
    })();
  }, [pageKey]);
  return { page, loaded };
}

export function useVisibility() {
  const [rows, setRows] = useState<VisibilityRow[]>(visibilityCache ?? []);
  const [loaded, setLoaded] = useState(!!visibilityCache);
  useEffect(() => {
    if (visibilityCache) return;
    (async () => {
      const { data } = await supabase.from("site_visibility").select("*").order("display_order");
      visibilityCache = (data as VisibilityRow[]) ?? [];
      setRows(visibilityCache);
      setLoaded(true);
    })();
  }, []);
  const isVisible = (key: string) => {
    const r = rows.find((x) => x.key === key);
    return r ? r.is_visible : true;
  };
  return { rows, loaded, isVisible };
}

export function clearVisibilityCache() {
  visibilityCache = null;
  pagesCache = null;
}
