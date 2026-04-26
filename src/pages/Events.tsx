import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { sampleEvents, ui } from "@/i18n/content";
import { Calendar, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Events() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const items = sampleEvents.filter((e) =>
    tab === "upcoming" ? e.status === "upcoming" : e.status === "completed"
  );

  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "الفعاليات", it: "Eventi" }}
        title={{ ar: "فعاليات الاتحاد", it: "Eventi dell'Unione" }}
        description={{
          ar: "مؤتمرات وندوات ودورات ولقاءات علمية ودعوية.",
          it: "Conferenze, seminari, corsi e incontri scientifici e religiosi.",
        }}
      />

      <section className="section-padding">
        <div className="container-wide">
          <div className="flex gap-2 mb-10">
            <Button
              variant={tab === "upcoming" ? "default" : "outline"}
              onClick={() => setTab("upcoming")}
            >
              {t(ui.upcomingEvents.ar, ui.upcomingEvents.it)}
            </Button>
            <Button
              variant={tab === "past" ? "default" : "outline"}
              onClick={() => setTab("past")}
            >
              {t(ui.pastEvents.ar, ui.pastEvents.it)}
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="card-elegant p-12 text-center text-muted-foreground">
              {t("لا توجد فعاليات حاليًا.", "Nessun evento al momento.")}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((e, i) => (
                <article key={i} className="card-elegant p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-center bg-primary/10 text-primary rounded-xl px-3 py-2 min-w-[68px]">
                      <div className="text-2xl font-bold leading-none">{new Date(e.date).getDate()}</div>
                      <div className="text-[10px] uppercase tracking-wider mt-1">
                        {new Date(e.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "it-IT", { month: "short" })}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground inline-flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {t(e.type.ar, e.type.it)}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t(e.title.ar, e.title.it)}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{t(e.description.ar, e.description.it)}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {t(e.location.ar, e.location.it)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {e.date}
                    </span>
                  </div>
                  {e.status === "upcoming" ? (
                    <Button className="mt-4 w-full">{t(ui.register.ar, ui.register.it)}</Button>
                  ) : (
                    <Button variant="outline" className="mt-4 w-full">{t(ui.watchReplay.ar, ui.watchReplay.it)}</Button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
