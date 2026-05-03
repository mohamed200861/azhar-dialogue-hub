import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/admin-utils";

type NewsItem = { id: string; slug: string | null; title: string; category: string; published_at: string | null; created_at: string };

export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("news_posts")
      .select("id,slug,title,category,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(15);
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("news_ticker_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "news_posts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!items || items.length === 0) return null;

  // Duplicate list for seamless loop
  const loop = [...items, ...items];

  return (
    <section
      className="bg-primary/5 border-y border-primary/15"
      aria-label="آخر الأخبار"
      dir="rtl"
    >
      <div className="container-wide flex items-stretch gap-3 py-2.5">
        <div className="shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold">
          <Newspaper className="h-3.5 w-3.5" />
          آخر الأخبار
        </div>
        <div className="news-ticker-mask flex-1 overflow-hidden relative">
          <div className="news-ticker-track flex gap-8 whitespace-nowrap will-change-transform">
            {loop.map((n, i) => (
              <Link
                key={`${n.id}-${i}`}
                to={`/news/${n.slug || n.id}`}
                className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{n.category}</span>
                <span className="font-medium text-foreground/90">{n.title}</span>
                <span className="text-[11px] text-muted-foreground">— {formatDate(n.published_at ?? n.created_at)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
