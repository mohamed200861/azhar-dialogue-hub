import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/SmartImage";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { applySeo } from "@/lib/seo";
import { formatDate } from "@/lib/admin-utils";
import { Search, Mic, Calendar, MapPin } from "lucide-react";

type Cat = { id: string; slug: string; title: string };
type K = {
  id: string; slug: string; title: string; description: string | null;
  speaker_name: string | null; mosque: string | null; location: string | null;
  khutbah_date: string | null; featured_image: string | null; category_id: string | null;
  is_featured: boolean;
};

export default function Khutbahs() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [items, setItems] = useState<K[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    applySeo({ title: "خطب وخطباء — اتحاد علماء الأزهر", description: "مكتبة خطب الجمعة والمناسبات بأصوات نخبة من الخطباء." });
    document.title = "خطب وخطباء — اتحاد علماء الأزهر";
    (async () => {
      const [c, k] = await Promise.all([
        supabase.from("khutbah_categories").select("id,slug,title").eq("is_active", true).order("sort_order"),
        supabase.from("khutbahs").select("id,slug,title,description,speaker_name,mosque,location,khutbah_date,featured_image,category_id,is_featured")
          .eq("publish_status", "published").order("is_featured", { ascending: false }).order("khutbah_date", { ascending: false, nullsFirst: false }).limit(60),
      ]);
      setCats((c.data ?? []) as Cat[]);
      setItems((k.data ?? []) as K[]);
    })();
  }, []);

  const filtered = (items ?? []).filter((k) =>
    (!cat || k.category_id === cat) &&
    (!q.trim() || (k.title + " " + (k.speaker_name ?? "") + " " + (k.description ?? "")).toLowerCase().includes(q.trim().toLowerCase()))
  );

  return (
    <SiteLayout>
      <PageHero eyebrow="خطب الجمعة والمناسبات" title="خطب وخطباء" description="مجموعة مختارة من الخطب المنبرية بأصوات نخبة من الخطباء، مع نصوصها للقراءة والاستفادة." />

      <section className="container-wide py-10">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث في الخطب…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCat("")} className={`px-3 py-1.5 rounded-full text-xs ${!cat ? "bg-primary text-primary-foreground" : "bg-muted"}`}>الكل</button>
            {cats.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c.title}</button>
            ))}
          </div>
        </div>

        {items === null ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2,3].map((i) => (<div key={i} className="card-elegant overflow-hidden"><Skeleton className="aspect-video w-full" /><div className="p-5 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></div></div>))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">لا توجد خطب منشورة حاليًا.</Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((k) => (
              <Link key={k.id} to={`/khutbahs/${k.slug}`} className="card-elegant overflow-hidden group flex flex-col">
                <div className="aspect-video bg-muted overflow-hidden">
                  <SmartImage src={k.featured_image} alt={k.title} variant="news" fallbackClassName="bg-gradient-emerald" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{k.title}</h3>
                  {k.speaker_name && <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> {k.speaker_name}</div>}
                  {k.khutbah_date && <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(k.khutbah_date)}</div>}
                  {(k.mosque || k.location) && <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[k.mosque, k.location].filter(Boolean).join(" — ")}</div>}
                  {k.description && <p className="text-sm text-muted-foreground line-clamp-3 mt-2 flex-1">{k.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section-padding pt-0">
        <div className="container-narrow"><ReaderFeedback entityType="page" pagePath="/khutbahs" /></div>
      </section>
    </SiteLayout>
  );
}
