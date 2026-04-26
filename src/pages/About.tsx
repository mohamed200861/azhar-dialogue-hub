import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { about, site, workAreas, objectives, activities, values } from "@/i18n/content";
import { Calendar, MapPin, Building2, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    document.title = "من نحن — اتحاد علماء الأزهر";
  }, []);
  return (
    <SiteLayout>
      <PageHero eyebrow="من نحن" title="اتحاد علماء الأزهر" description={about.short} />

      <section className="section-padding">
        <div className="container-narrow grid lg:grid-cols-[2fr,1fr] gap-12">
          <div>
            <h2 className="heading-section mb-5">نبذة عن الاتحاد</h2>
            <p className="text-muted-foreground leading-loose text-lg">{about.full}</p>

            <h3 className="text-2xl font-bold mt-12 mb-6">أبرز أنشطتنا</h3>
            <ul className="space-y-3">
              {activities.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{a}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-2xl font-bold mt-12 mb-6">أهدافنا</h3>
            <ul className="space-y-3">
              {objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 pt-0.5">{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="card-elegant p-6 sticky top-24">
              <h4 className="font-bold mb-5 text-lg">معلومات أساسية</h4>
              <div className="space-y-4 text-sm">
                {[
                  { icon: Calendar, label: "سنة التأسيس", value: site.founded },
                  { icon: MapPin, label: "المقر", value: site.hq.ar },
                  { icon: Building2, label: "الكيان القانوني", value: "مؤسسة غير ربحية" },
                  { icon: Sparkles, label: "الشعار", value: site.slogan.ar },
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

      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="text-center mb-10">
            <span className="eyebrow">ميادين العمل</span>
            <h2 className="heading-section mt-3">نعمل في خمسة مجالات أساسية</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workAreas.map((f, i) => (
              <div key={i} className="card-elegant p-6">
                <h3 className="font-bold text-lg mb-2 text-primary">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <span className="eyebrow">قيمنا</span>
            <h2 className="heading-section mt-3">القيم التي نلتزم بها</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {values.map((v, i) => (
              <span key={i} className="px-5 py-2.5 rounded-full bg-primary/5 text-primary border border-primary/20 font-semibold">
                {v.label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
