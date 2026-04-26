import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { sampleLibrary, libraryCategories, ui } from "@/i18n/content";
import { BookOpen, Download, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Library() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const items = sampleLibrary.filter((it) => {
    const text = `${it.title.ar} ${it.title.it}`.toLowerCase();
    const matchesQ = !query || text.includes(query.toLowerCase());
    const matchesCat = !activeCat || it.category.ar === activeCat;
    return matchesQ && matchesCat;
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "المكتبة", it: "Biblioteca" }}
        title={{ ar: "المكتبة الرقمية", it: "Biblioteca digitale" }}
        description={{
          ar: "كتب وبحوث وإصدارات ومواد تدريبية متاحة للقراءة والتحميل.",
          it: "Libri, ricerche, pubblicazioni e materiali formativi per la lettura e il download.",
        }}
      />

      <section className="section-padding">
        <div className="container-wide">
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
              <Button variant={activeCat === null ? "default" : "outline"} size="sm" onClick={() => setActiveCat(null)}>
                {t("الكل", "Tutti")}
              </Button>
              {libraryCategories.map((c, i) => (
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

          {items.length === 0 ? (
            <div className="card-elegant p-12 text-center text-muted-foreground">
              {t("لا توجد عناصر مطابقة.", "Nessun elemento trovato.")}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((b, i) => (
                <article key={i} className="card-elegant overflow-hidden flex flex-col">
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/15 to-primary-glow/10 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-primary/40" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">
                      {t(b.category.ar, b.category.it)}
                    </span>
                    <h3 className="font-bold mb-1 line-clamp-2">{t(b.title.ar, b.title.it)}</h3>
                    <div className="text-xs text-muted-foreground mb-3">{t(b.author.ar, b.author.it)}</div>
                    <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-4">
                      {t(b.description.ar, b.description.it)}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3.5 w-3.5" /> {t(ui.readOnline.ar, ui.readOnline.it)}
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Download className="h-3.5 w-3.5" /> {t(ui.download.ar, ui.download.it)}
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
