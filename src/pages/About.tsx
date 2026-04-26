import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { about, site, fields, objectives, activities, values } from "@/i18n/content";
import { Calendar, MapPin, Building2, Sparkles, CheckCircle2 } from "lucide-react";

export default function About() {
  const { t } = useLanguage();
  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "من نحن", it: "Chi siamo" }}
        title={{ ar: "اتحاد علماء الأزهر", it: "Azhar Scholars Union" }}
        description={about.short}
      />

      <section className="section-padding">
        <div className="container-narrow grid lg:grid-cols-[2fr,1fr] gap-12">
          <div>
            <h2 className="heading-section mb-5">{t("نبذة عن الاتحاد", "Presentazione dell'Unione")}</h2>
            <p className="text-muted-foreground leading-loose text-lg">{t(about.full.ar, about.full.it)}</p>

            <h3 className="text-2xl font-bold mt-12 mb-6">{t("أبرز أنشطتنا", "Le nostre principali attività")}</h3>
            <ul className="space-y-3">
              {activities.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{t(a.ar, a.it)}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-2xl font-bold mt-12 mb-6">{t("أهدافنا", "I nostri obiettivi")}</h3>
            <ul className="space-y-3">
              {objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 pt-0.5">{t(o.ar, o.it)}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="card-elegant p-6 sticky top-24">
              <h4 className="font-bold mb-5 text-lg">{t("معلومات أساسية", "Informazioni essenziali")}</h4>
              <div className="space-y-4 text-sm">
                {[
                  { icon: Calendar, label: t("سنة التأسيس", "Anno di fondazione"), value: site.founded },
                  { icon: MapPin, label: t("المقر", "Sede"), value: t(site.hq.ar, site.hq.it) },
                  { icon: Building2, label: t("الكيان القانوني", "Status legale"), value: t("مؤسسة غير ربحية", "Organizzazione non profit") },
                  { icon: Sparkles, label: t("الشعار", "Slogan"), value: t(site.slogan.ar, site.slogan.it) },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="font-semibold mt-0.5">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Fields */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="text-center mb-10">
            <span className="eyebrow">{t("ميادين العمل", "Aree di lavoro")}</span>
            <h2 className="heading-section mt-3">{t("نعمل في خمسة مجالات أساسية", "Operiamo in cinque ambiti principali")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {fields.map((f, i) => (
              <div key={i} className="card-elegant p-6">
                <h3 className="font-bold text-lg mb-2 text-primary">{t(f.ar, f.it)}</h3>
                <p className="text-sm text-muted-foreground">{t(f.desc.ar, f.desc.it)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <span className="eyebrow">{t("قيمنا", "Valori")}</span>
            <h2 className="heading-section mt-3">{t("القيم التي نلتزم بها", "I valori che ci guidano")}</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {values.map((v, i) => (
              <span key={i} className="px-5 py-2.5 rounded-full bg-primary/5 text-primary border border-primary/20 font-semibold">
                {t(v.ar, v.it)}
              </span>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
