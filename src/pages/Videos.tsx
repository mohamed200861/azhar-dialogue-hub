import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { videoCategories, placeholders } from "@/i18n/content";
import { PlayCircle, Radio, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const sampleVideos = [
  { title: { ar: "كلمة الأمين العام بمناسبة افتتاح المؤتمر", it: "Discorso del Segretario Generale" }, duration: "12:34", date: "2024-09-12" },
  { title: { ar: "محاضرة: مقاصد الشريعة في عصرنا", it: "Lezione: Gli obiettivi della Sharia oggi" }, duration: "45:21", date: "2024-08-04" },
  { title: { ar: "ندوة: الأسرة المسلمة في الغرب", it: "Seminario: La famiglia musulmana in Occidente" }, duration: "01:12:08", date: "2024-07-21" },
  { title: { ar: "لقاء مع علماء الاتحاد", it: "Intervista con gli studiosi dell'Unione" }, duration: "38:15", date: "2024-06-30" },
];

export default function Videos() {
  const { t } = useLanguage();
  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "المرئيات", it: "Video" }}
        title={{ ar: "المرئيات والبث المباشر", it: "Video e dirette" }}
        description={{
          ar: "محاضرات ولقاءات وبثوث مباشرة من فعاليات الاتحاد.",
          it: "Lezioni, interviste e dirette dalle attività dell'Unione.",
        }}
      />

      {/* Live block */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="card-elegant overflow-hidden grid lg:grid-cols-2">
            <div className="aspect-video lg:aspect-auto bg-gradient-hero flex flex-col items-center justify-center text-primary-foreground p-8 relative">
              <div className="absolute inset-0 pattern-islamic opacity-20" />
              <Radio className="h-16 w-16 mb-4 relative" />
              <div className="text-xs uppercase tracking-[0.25em] mb-2 relative">
                {t("البث المباشر", "Diretta live")}
              </div>
              <div className="text-2xl font-bold relative">{t("غير متاح حاليًا", "Non disponibile")}</div>
            </div>
            <div className="p-8 lg:p-10">
              <h2 className="text-2xl font-bold mb-3">{t("لا يوجد بث حاليًا", "Nessuna diretta in corso")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{t(placeholders.noLive.ar, placeholders.noLive.it)}</p>
              <Button variant="outline">{t("تنبيهي عند البث القادم", "Avvisami alla prossima diretta")}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-12">
        <div className="container-wide">
          <div className="flex flex-wrap gap-2">
            {videoCategories.map((c, i) => (
              <Button key={i} variant="outline" size="sm">{t(c.ar, c.it)}</Button>
            ))}
          </div>
        </div>
      </section>

      {/* Recordings */}
      <section className="pb-20">
        <div className="container-wide">
          <h2 className="heading-section mb-8">{t("أحدث التسجيلات", "Ultime registrazioni")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleVideos.map((v, i) => (
              <article key={i} className="card-elegant overflow-hidden group cursor-pointer">
                <div className="aspect-video bg-gradient-emerald relative flex items-center justify-center">
                  <PlayCircle className="h-14 w-14 text-white/80 group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 end-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {v.duration}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold mb-2 line-clamp-2">{t(v.title.ar, v.title.it)}</h3>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {v.date}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
