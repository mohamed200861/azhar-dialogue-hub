import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Download, Eye, Search, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["كتب","ملفات PDF","بحوث علمية","مقالات علمية","مجلات","إصدارات الاتحاد","مواد تدريبية","المرئيات","الصوتيات"];

export default function LibraryPage() {
  const [items, setItems] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [year, setYear] = useState<string>("all");

  useEffect(() => {
    document.title = "المكتبة الرقمية — اتحاد علماء الأزهر";
    (async () => {
      const { data } = await supabase
        .from("library_items")
        .select("*")
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false });
      setItems(data ?? []);
    })();
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    (items ?? []).forEach((i) => {
      const d = i.published_at ?? i.created_at;
      if (d) set.add(String(new Date(d).getFullYear()));
    });
    return Array.from(set).sort().reverse();
  }, [items]);

  const filtered = (items ?? []).filter((b) => {
    const matchQ = !q || b.title?.includes(q) || b.description?.includes(q);
    const matchC = !cat || b.category === cat;
    const d = b.published_at ?? b.created_at;
    const matchY = year === "all" || (d && String(new Date(d).getFullYear()) === year);
    return matchQ && matchC && matchY;
  });

  const handleDownload = async (item: any) => {
    if (!item.file_url && !item.external_url) {
      toast.error("لا يوجد ملف متاح للتحميل");
      return;
    }
    await supabase.from("library_items").update({ downloads_count: (item.downloads_count ?? 0) + 1 }).eq("id", item.id);
    window.open(item.file_url || item.external_url, "_blank");
  };

  return (
    <SiteLayout>
      <PageHero eyebrow="المكتبة" title="المكتبة الرقمية"
        description="كتب وبحوث وإصدارات ومواد تدريبية متاحة للقراءة والتحميل." />

      <section className="section-padding">
        <div className="container-wide">
          <div className="mb-10 space-y-5">
            <div className="relative max-w-xl">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في المكتبة…" className="ps-10 h-11" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={cat === null ? "default" : "outline"} size="sm" onClick={() => setCat(null)}>الكل</Button>
              {CATEGORIES.map((c) => (
                <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>{c}</Button>
              ))}
            </div>
            {years.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">السنة:</span>
                <Button variant={year === "all" ? "default" : "outline"} size="sm" onClick={() => setYear("all")}>الكل</Button>
                {years.map((y) => (
                  <Button key={y} variant={year === y ? "default" : "outline"} size="sm" onClick={() => setYear(y)}>{y}</Button>
                ))}
              </div>
            )}
          </div>

          {items === null ? (
            <div className="card-elegant p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="card-elegant p-12 text-center text-muted-foreground">
              لا توجد عناصر في المكتبة حاليًا. سيتم إضافة الكتب والملفات قريبًا.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((b) => (
                <article key={b.id} className="card-elegant overflow-hidden flex flex-col">
                  <Link to={`/library/${b.slug || b.id}`} className="block">
                    <div className="aspect-[3/4] bg-gradient-to-br from-primary/15 to-primary-glow/10 flex items-center justify-center relative">
                      {b.cover_image ? <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover" /> : <BookOpen className="h-16 w-16 text-primary/40" />}
                      {b.is_featured && <span className="absolute top-2 start-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> مميز</span>}
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">{b.category}</span>
                    <Link to={`/library/${b.slug || b.id}`} className="hover:text-primary">
                      <h3 className="font-bold mb-1 line-clamp-2">{b.title}</h3>
                    </Link>
                    <div className="text-xs text-muted-foreground mb-3">{b.publisher_source}</div>
                    {b.description && <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-4">{b.description}</p>}
                    <div className="text-[10px] text-muted-foreground mb-3 flex items-center justify-between">
                      <span>{b.language ?? "العربية"}{b.pages_count ? ` · ${b.pages_count} صفحة` : ""}</span>
                      <span>{b.downloads_count ?? 0} تحميل</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link to={`/library/${b.slug || b.id}`}><Eye className="h-3.5 w-3.5" /> عرض</Link>
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleDownload(b)}>
                        <Download className="h-3.5 w-3.5" /> تحميل
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
