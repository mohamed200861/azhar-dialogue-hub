import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { vision, mission, values, objectives } from "@/i18n/content";
import { Sparkles, HeartHandshake, CheckCircle2, Compass } from "lucide-react";

export default function Vision() {
  const { t } = useLanguage();
  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "التوجهات", it: "Direzione" }}
        title={{ ar: "الرؤية والرسالة", it: "Visione e Missione" }}
        description={{
          ar: "ركائز عمل الاتحاد ومبادئه التي تحدد مسار خدمته العلمية والدعوية.",
          it: "I pilastri e i principi che guidano il lavoro scientifico e religioso dell'Unione.",
        }}
      />

      <section className="section-padding">
        <div className="container-narrow grid md:grid-cols-2 gap-6">
          <div className="card-elegant p-10 relative overflow-hidden">
            <div className="absolute -top-10 -end-10 w-48 h-48 rounded-full bg-primary/5" />
            <Sparkles className="h-10 w-10 text-primary mb-5 relative" />
            <h2 className="text-3xl font-bold mb-4 relative">{t("رؤيتنا", "La nostra visione")}</h2>
            <p className="text-muted-foreground leading-loose text-lg relative">{t(vision.ar, vision.it)}</p>
          </div>
          <div className="card-elegant p-10 relative overflow-hidden">
            <div className="absolute -top-10 -end-10 w-48 h-48 rounded-full bg-crimson/5" />
            <HeartHandshake className="h-10 w-10 text-crimson mb-5 relative" />
            <h2 className="text-3xl font-bold mb-4 relative">{t("رسالتنا", "La nostra missione")}</h2>
            <p className="text-muted-foreground leading-loose text-lg relative">{t(mission.ar, mission.it)}</p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-gradient-soft">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <Compass className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="heading-section">{t("منهجيتنا", "La nostra metodologia")}</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              {t(
                "نعمل وفق منهج الأزهر الشريف في الوسطية والاعتدال، بعيدًا عن الغلو والتفريط، ساعين لخدمة قضايا الأمة وفق ضوابط علمية رصينة.",
                "Operiamo secondo il metodo di Al-Azhar nella moderazione e nell'equilibrio, lontano da estremismi, al servizio della comunità con un approccio scientifico rigoroso."
              )}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((v, i) => (
              <div key={i} className="card-elegant p-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold">{t(v.ar, v.it)}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <span className="eyebrow">{t("الأهداف", "Obiettivi")}</span>
            <h2 className="heading-section mt-3">{t("أهداف الاتحاد", "Gli obiettivi dell'Unione")}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {objectives.map((o, i) => (
              <div key={i} className="card-elegant p-6 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/90">{t(o.ar, o.it)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
