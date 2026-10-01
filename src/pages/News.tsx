import { useEffect, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/PageHero";
import { Search, Calendar, Loader2, Download, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/admin-utils";
import { applySeo } from "@/lib/seo";
import { InFeedAd } from "@/components/InFeedAd";

const CATEGORIES = ["بيانات رسمية","أخبار الاتحاد","مقالات","قضايا معاصرة","تهاني وتعازي","لقاءات وحوارات","أنشطة الاتحاد"];

export default function NewsPage() {
  const [items, setItems] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: "الأخبار والبيانات الرسمية",
      description: "آخر بيانات اتحاد علماء الأزهر وأنشطته العلمية والدعوية ومقالاته وقضاياه المعاصرة.",
    });
    (async () => {
      const { data } = await supabase
        .from("news_posts")
        .select("id,slug,title,excerpt,cover_image,category,publisher_source,published_at,created_at,is_featured")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      setItems(data ?? []);
    })();
  }, []);

  const filtered = (items ?? []).filter((n) => {
    const matchesQ = !q || (n.title?.includes(q) || n.excerpt?.includes(q));
    const matchesC = !cat || n.category === cat;
    return matchesQ && matchesC;
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="الأخبار"
        title="الأخبار والبيانات الرسمية"
        description="تابعوا آخر بيانات الاتحاد وأنشطته العلمية والدعوية."
      />

      <section className="section-padding">
        <div className="container-wide">
          <div className="mb-10 space-y-5">
            <div className="relative max-w-xl">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث في الأخبار…" className="ps-10 h-11" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={cat === null ? "default" : "outline"} size="sm" onClick={() => setCat(null)}>الكل</Button>
              {CATEGORIES.map((c) => (
                <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>{c}</Button>
              ))}
            </div>
          </div>

          {items === null ? (
            <div className="card-elegant p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="card-elegant p-12 text-center text-muted-foreground">
              لا توجد أخبار منشورة حاليًا. ترقبوا المحتوى الجديد قريبًا.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.flatMap((n, i) => {
                const cell: ReactNode = (
                  <Link key={n.id} to={`/news/${n.slug || n.id}`} className="card-elegant overflow-hidden flex flex-col group">
                    <div className="aspect-[16/10] overflow-hidden">
                      <SmartImage src={n.cover_image} alt={n.title} variant="news" fallbackClassName="bg-gradient-emerald" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{n.category}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(n.published_at ?? n.created_at)}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{n.title}</h3>
                      {n.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{n.excerpt}</p>}
                      <div className="text-xs text-muted-foreground mt-auto">نُشر بواسطة: <span className="font-medium text-foreground/80">{n.publisher_source}</span></div>
                    </div>
                  </Link>
                );
                // In-feed ad ogni 4 notizie (mai dopo l'ultima)
                const showAd = (i + 1) % 4 === 0 && i < filtered.length - 1;
                return showAd ? [cell, <InFeedAd key={`ad-${i}`} />] : [cell];
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
