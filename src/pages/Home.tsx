import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, Calendar, BookOpen, Users, Newspaper, PlayCircle,
  Scale, GitFork, ShieldCheck, Building2, HeartHandshake, Megaphone,
  GraduationCap, Tv, Sparkles, MapPin, Mail, Facebook,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import {
  hero, stats, about, vision, mission, values, fields,
  sampleNews, sampleEvents, leadership, ui, site,
} from "@/i18n/content";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const iconMap: Record<string, any> = {
  Scale, GitFork, BookOpen, ShieldCheck, Building2, HeartHandshake,
  Megaphone, GraduationCap, Users, Tv,
};

function ArrowEnd() {
  const { dir } = useLanguage();
  return dir === "rtl" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />;
}

export default function Home() {
  const { t, lang } = useLanguage();

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 pattern-islamic opacity-25" />
        <div className="absolute top-1/4 end-0 w-[500px] h-[500px] rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="absolute bottom-0 start-1/4 w-[400px] h-[400px] rounded-full bg-crimson/10 blur-3xl" />

        <div className="container-wide relative py-20 md:py-28 lg:py-32 grid lg:grid-cols-[1.3fr,1fr] gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {t("مؤسسة إسلامية دعوية علمية", "Istituzione islamica e scientifica")}
            </div>
            <h1 className="heading-display mb-5">{t(hero.title.ar, hero.title.it)}</h1>
            <p className={`text-xl md:text-2xl text-primary-foreground/90 mb-3 font-serif italic ${lang === "ar" ? "font-normal not-italic" : ""}`}>
              {t(hero.subtitle.ar, hero.subtitle.it)}
            </p>
            <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl leading-relaxed">
              {t(hero.description.ar, hero.description.it)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to={hero.buttons.primary.href}>
                  {t(hero.buttons.primary.ar, hero.buttons.primary.it)}
                  <ArrowEnd />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                <Link to={hero.buttons.secondary.href}>{t(hero.buttons.secondary.ar, hero.buttons.secondary.it)}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                <Link to={hero.buttons.tertiary.href}>{t(hero.buttons.tertiary.ar, hero.buttons.tertiary.it)}</Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-glow/30 to-crimson/20 blur-3xl scale-110" />
              <div className="relative bg-white/95 rounded-[2rem] p-10 shadow-elegant">
                <img src={logo} alt={t(site.name.ar, site.name.it)} className="w-72 h-72 object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-black/15 backdrop-blur">
          <div className="container-wide py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground">{s.value}</div>
                <div className="text-xs md:text-sm text-primary-foreground/75 mt-1">{t(s.label.ar, s.label.it)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT PREVIEW */}
      <section className="section-padding">
        <div className="container-narrow grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="eyebrow">{t("من نحن", "Chi siamo")}</span>
            <h2 className="heading-section mt-3 mb-5">
              {t("منهج أزهري وسطي يخدم الأمة والإنسانية", "Un metodo azharita moderato al servizio della comunità")}
            </h2>
            <p className="text-muted-foreground leading-loose mb-6">{t(about.full.ar, about.full.it)}</p>
            <Button asChild variant="outline">
              <Link to="/about">
                {t("اقرأ المزيد عنا", "Scopri di più")}
                <ArrowEnd />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: t("التأسيس", "Fondazione"), value: site.founded },
              { icon: MapPin, label: t("المقر", "Sede"), value: t(site.hq.ar, site.hq.it) },
              { icon: Building2, label: t("الكيان", "Status"), value: t("غير ربحية", "Non profit") },
              { icon: Sparkles, label: t("المنهج", "Metodo"), value: t("أزهري وسطي", "Azharita moderato") },
            ].map((item, i) => (
              <div key={i} className="card-elegant p-6">
                <item.icon className="h-7 w-7 text-primary mb-3" />
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="font-semibold text-foreground mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <span className="eyebrow">{t("التوجهات", "Direzione")}</span>
            <h2 className="heading-section mt-3">{t("الرؤية والرسالة", "Visione e Missione")}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-elegant p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-primary/5" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("رؤيتنا", "La nostra visione")}</h3>
                <p className="text-muted-foreground leading-loose">{t(vision.ar, vision.it)}</p>
              </div>
            </div>
            <div className="card-elegant p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-crimson/5" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-crimson/10 text-crimson mb-4">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("رسالتنا", "La nostra missione")}</h3>
                <p className="text-muted-foreground leading-loose">{t(mission.ar, mission.it)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="eyebrow">{t("قيمنا", "Valori")}</span>
            <h2 className="heading-section mt-3">{t("القيم التي نلتزم بها", "I valori che ci guidano")}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {values.map((v, i) => {
              const Icon = iconMap[v.icon] || Sparkles;
              return (
                <div key={i} className="card-elegant p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-sm">{t(v.ar, v.it)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FIELDS OF WORK */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="eyebrow">{t("ميادين العمل", "Aree di lavoro")}</span>
            <h2 className="heading-section mt-3">{t("مجالات نشاط الاتحاد", "I campi di azione dell'Unione")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {fields.map((f, i) => {
              const Icon = iconMap[f.icon] || Sparkles;
              return (
                <div key={i} className="card-elegant p-6 group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-emerald text-primary-foreground mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t(f.ar, f.it)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(f.desc.ar, f.desc.it)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LATEST NEWS */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <span className="eyebrow">{t("الأخبار", "News")}</span>
              <h2 className="heading-section mt-3">{t("آخر الأخبار والبيانات", "Ultime news e comunicati")}</h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/news">{t(ui.viewAll.ar, ui.viewAll.it)} <ArrowEnd /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleNews.slice(0, 3).map((n, i) => (
              <article key={i} className="card-elegant overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-gradient-emerald flex items-center justify-center text-primary-foreground/40">
                  <Newspaper className="h-16 w-16" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {t(n.category.ar, n.category.it)}
                    </span>
                    <span>{n.date}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{t(n.title.ar, n.title.it)}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{t(n.excerpt.ar, n.excerpt.it)}</p>
                  <Link to="/news" className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
                    {t(ui.readMore.ar, ui.readMore.it)} <ArrowEnd />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <span className="eyebrow">{t("الفعاليات", "Eventi")}</span>
              <h2 className="heading-section mt-3">{t(ui.upcomingEvents.ar, ui.upcomingEvents.it)}</h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/events">{t(ui.viewAll.ar, ui.viewAll.it)} <ArrowEnd /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {sampleEvents.filter(e => e.status === "upcoming").slice(0, 3).map((e, i) => (
              <article key={i} className="card-elegant p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-center bg-primary/10 text-primary rounded-xl px-3 py-2 min-w-[64px]">
                    <div className="text-2xl font-bold leading-none">{new Date(e.date).getDate()}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1">
                      {new Date(e.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "it-IT", { month: "short" })}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {t(e.type.ar, e.type.it)}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t(e.title.ar, e.title.it)}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{t(e.description.ar, e.description.it)}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {t(e.location.ar, e.location.it)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP PREVIEW */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <span className="eyebrow">{t("القيادة", "Leadership")}</span>
            <h2 className="heading-section mt-3">{t("قيادة الاتحاد", "La guida dell'Unione")}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {leadership.map((p, i) => (
              <div key={i} className="card-elegant p-8 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-emerald text-primary-foreground flex items-center justify-center text-3xl font-bold mb-4">
                  {p.initials}
                </div>
                <h3 className="font-bold text-lg">{t(p.name.ar, p.name.it)}</h3>
                <div className="text-sm text-primary mt-1">{t(p.role.ar, p.role.it)}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/leadership">{t("تعرف على القيادة", "Scopri la leadership")} <ArrowEnd /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* LIBRARY + VIDEO PREVIEW */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide grid md:grid-cols-2 gap-6">
          <Link to="/library" className="card-elegant p-8 group block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t("المكتبة الرقمية", "Biblioteca digitale")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("كتب وبحوث وإصدارات الاتحاد متاحة للقراءة والتحميل.", "Libri, ricerche e pubblicazioni dell'Unione disponibili per la lettura e il download.")}
            </p>
            <span className="text-primary font-semibold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              {t("استكشف المكتبة", "Esplora la biblioteca")} <ArrowEnd />
            </span>
          </Link>
          <Link to="/videos" className="card-elegant p-8 group block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-crimson/10 text-crimson mb-5 group-hover:scale-110 transition-transform">
              <PlayCircle className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t("المرئيات والبث المباشر", "Video e dirette")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("محاضرات ولقاءات وبثوث مباشرة تواكب أنشطة الاتحاد.", "Lezioni, interviste e dirette che documentano le attività dell'Unione.")}
            </p>
            <span className="text-crimson font-semibold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              {t("مشاهدة المرئيات", "Guarda i video")} <ArrowEnd />
            </span>
          </Link>
        </div>
      </section>

      {/* PARTNERSHIPS CTA */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-10 md:p-16 text-center">
            <div className="absolute inset-0 pattern-islamic opacity-20" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/80">
                {t("الشراكات", "Collaborazioni")}
              </span>
              <h2 className="heading-section mt-3 mb-4 max-w-2xl mx-auto">
                {t("شراكاتنا المؤسسية", "Le nostre collaborazioni istituzionali")}
              </h2>
              <p className="text-primary-foreground/85 max-w-2xl mx-auto mb-8 leading-relaxed">
                {t(ui.partnerCta.ar, ui.partnerCta.it)}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <a href={`mailto:${site.email}`}>
                    <Mail className="h-4 w-4" /> {site.email}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                  <a href={site.facebook} target="_blank" rel="noreferrer">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
