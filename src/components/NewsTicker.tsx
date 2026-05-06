import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TickerItem = { id: string; title: string; link_url: string | null; badge: string | null };

export function NewsTicker() {
  const [items, setItems] = useState<TickerItem[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("news_ticker_items" as any)
      .select("id,title,link_url,badge")
      .eq("is_active", true)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(20);
    setItems(((data as any) ?? []) as TickerItem[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("news_ticker_items_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "news_ticker_items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!items || items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <section className="bg-primary/5 border-y border-primary/15" aria-label="آخر الأخبار" dir="rtl">
      <div className="container-wide flex items-stretch gap-3 py-2.5">
        <div className="shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold">
          <Newspaper className="h-3.5 w-3.5" />
          آخر الأخبار
        </div>
        <div className="news-ticker-mask flex-1 overflow-hidden relative">
          <div className="news-ticker-track flex gap-8 whitespace-nowrap will-change-transform">
            {loop.map((n, i) => {
              const content = (
                <span className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  {n.badge && <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{n.badge}</span>}
                  <span className="font-medium text-foreground/90">{n.title}</span>
                </span>
              );
              return n.link_url ? (
                <Link key={`${n.id}-${i}`} to={n.link_url}>{content}</Link>
              ) : (
                <span key={`${n.id}-${i}`}>{content}</span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
