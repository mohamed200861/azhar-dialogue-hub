import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { sampleNews, newsCategories, ui } from "@/i18n/content";
import { Newspaper, Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function News() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sampleNews.filter((n) => {
      const text = `${n.title.ar} ${n.title.it} ${n.excerpt.ar} ${n.excerpt.it}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesCat = !activeCat || n.category.ar === activeCat;
      return matchesQuery && matchesCat;
    });
  }, [query, activeCat]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "الأخبار", it: "News" }}
        title={{ ar: "الأخبار والبيانات الرسمية", it: "News e comunicati ufficiali" }}
        description={{
          ar: "تابعوا آخر بيانات الاتحاد وأنشطته العلمية والدعوية.",
          it: "Segui gli ultimi comunicati e le attività scientifiche e religiose dell'Unione.",
        }}
      />

      <section className="section-padding">
        <div className="container-wide">
          {/* Filters */}
          <div className="mb-10 space-y-5">
            <div className="relative max-w-xl">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t(ui.search.ar, ui.search.it)}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ps-10 h-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCat === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCat(null)}
              >
                {t("الكل", "Tutti")}
              </Button>
              {newsCategories.map((c, i) => (
                <Button
                  key={i}
                  variant={activeCat === c.ar ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCat(c.ar)}
                >
                  {t(c.ar, c.it)}
                </Button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card-elegant p-12 text-center text-muted-foreground">
              {t("لا توجد نتائج مطابقة.", "Nessun risultato trovato.")}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((n, i) => (
                <article key={i} className="card-elegant overflow-hidden flex flex-col">
                  <div className="aspect-[16/10] bg-gradient-emerald flex items-center justify-center text-primary-foreground/40">
                    <Newspaper className="h-16 w-16" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {t(n.category.ar, n.category.it)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {n.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{t(n.title.ar, n.title.it)}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{t(n.excerpt.ar, n.excerpt.it)}</p>
                    <span className="text-sm font-semibold text-primary">{t(ui.readMore.ar, ui.readMore.it)} ←</span>
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
