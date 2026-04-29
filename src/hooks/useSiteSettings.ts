import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_name: string;
  site_slogan: string;
  contact_email: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  instagram_url: string;
  logo_url: string | null;
  favicon_url: string | null;
  footer_text: string;
  seo_title: string;
  seo_description: string;
  show_news_section: boolean;
  show_events_section: boolean;
  show_library_section: boolean;
  show_videos_section: boolean;
};

const DEFAULTS: SiteSettings = {
  site_name: "اتحاد علماء الأزهر",
  site_slogan: "منهج أزهري… ورسالة عالمية",
  contact_email: "alazharscholarunion@gmail.com",
  facebook_url: "https://www.facebook.com/share/1ECiSRM9VT/",
  twitter_url: "",
  youtube_url: "",
  instagram_url: "",
  logo_url: null,
  favicon_url: null,
  footer_text: "جميع الحقوق محفوظة — اتحاد علماء الأزهر",
  seo_title: "اتحاد علماء الأزهر",
  seo_description: "اتحاد علماء الأزهر — مؤسسة إسلامية دعوية علمية غير ربحية.",
  show_news_section: true,
  show_events_section: true,
  show_library_section: true,
  show_videos_section: true,
};

let cache: SiteSettings | null = null;
const subscribers = new Set<(s: SiteSettings) => void>();
let realtimeSetup = false;

async function fetchAll(): Promise<SiteSettings> {
  const { data } = await supabase.from("site_settings").select("key,value");
  const obj: any = { ...DEFAULTS };
  (data ?? []).forEach((r: any) => {
    const v = r.value?.value !== undefined ? r.value.value : r.value;
    if (v !== undefined && v !== null) obj[r.key] = v;
  });
  return obj as SiteSettings;
}

function notify(s: SiteSettings) {
  cache = s;
  subscribers.forEach((cb) => cb(s));
}

function ensureRealtime() {
  if (realtimeSetup) return;
  realtimeSetup = true;
  supabase
    .channel("site_settings_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, async () => {
      const fresh = await fetchAll();
      notify(fresh);
    })
    .subscribe();
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cache ?? DEFAULTS);
  const [loaded, setLoaded] = useState(!!cache);

  useEffect(() => {
    ensureRealtime();
    let alive = true;
    const cb = (s: SiteSettings) => {
      if (!alive) return;
      setSettings(s);
      setLoaded(true);
    };
    subscribers.add(cb);

    if (!cache) {
      fetchAll().then((s) => alive && notify(s));
    } else {
      setLoaded(true);
    }

    return () => {
      alive = false;
      subscribers.delete(cb);
    };
  }, []);

  return { settings, loaded };
}

export async function refreshSiteSettings() {
  const fresh = await fetchAll();
  notify(fresh);
  return fresh;
}

export function clearSettingsCache() {
  cache = null;
}
