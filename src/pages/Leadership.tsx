import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { leadership, placeholders, site } from "@/i18n/content";
import { Mail } from "lucide-react";

export default function Leadership() {
  const { t } = useLanguage();
  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "القيادة", it: "Leadership" }}
        title={{ ar: "قيادة الاتحاد", it: "La guida dell'Unione" }}
        description={{
          ar: "نخبة من العلماء والإداريين يقودون مسيرة الاتحاد العلمية والدعوية.",
          it: "Studiosi e dirigenti che guidano il percorso scientifico e religioso dell'Unione.",
        }}
      />

      <section className="section-padding">
        <div className="container-narrow grid md:grid-cols-3 gap-6">
          {leadership.map((p, i) => (
            <article key={i} className="card-elegant p-8 text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-emerald text-primary-foreground flex items-center justify-center text-5xl font-bold mb-5 shadow-elegant">
                {p.initials}
              </div>
              <h3 className="text-xl font-bold mb-1">{t(p.name.ar, p.name.it)}</h3>
              <div className="text-sm text-primary font-semibold mb-4">{t(p.role.ar, p.role.it)}</div>
              <p className="text-sm text-muted-foreground italic mb-5 min-h-[3rem]">
                {t(placeholders.bioSoon.ar, placeholders.bioSoon.it)}
              </p>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-primary"
              >
                <Mail className="h-4 w-4" /> {t("تواصل", "Contatti")}
              </a>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
