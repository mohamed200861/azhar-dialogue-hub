import { Link } from "react-router-dom";
import {
  ArrowLeft, Calendar, BookOpen, Newspaper, PlayCircle,
  Scale, GitFork, ShieldCheck, Building2, HeartHandshake, Megaphone,
  GraduationCap, Tv, Users, Sparkles, MapPin, Mail, Facebook,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import {
  hero, about, vision, mission, values, workAreas,
  sampleNews, sampleEvents, ui, site,
} from "@/i18n/content";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const iconMap: Record<string, any> = {
  Scale, GitFork, BookOpen, ShieldCheck, Building2, HeartHandshake,
  Megaphone, GraduationCap, Users, Tv,
};

export default function Home() {
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
              مؤسسة إسلامية دعوية علمية
            </div>
            <h1 className="heading-display mb-5">{hero.title.ar}</h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-3 font-normal">
              {hero.subtitle.ar}
            </p>
            <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl leading-relaxed">
              {hero.description.ar}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to={hero.buttons.primary.href}>
                  {hero.buttons.primary.ar}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                <Link to={hero.buttons.secondary.href}>{hero.buttons.secondary.ar}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                <Link to={hero.buttons.tertiary.href}>{hero.buttons.tertiary.ar}</Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-glow/30 to-crimson/20 blur-3xl scale-110" />
              <div className="relative bg-white/95 rounded-[2rem] p-10 shadow-elegant">
                <img src={logo} alt={site.name.ar} className="w-72 h-72 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT PREVIEW */}
      <section className="section-padding">
        <div className="container-narrow grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="eyebrow">من نحن</span>
            <h2 className="heading-section mt-3 mb-5">منهج أزهري وسطي يخدم الأمة والإنسانية</h2>
            <p className="text-muted-foreground leading-loose mb-6">{about.full.ar}</p>
            <Button asChild variant="outline">
              <Link to="/about">
                اقرأ المزيد عنا
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: "التأسيس", value: site.founded },
              { icon: MapPin, label: "المقر", value: site.hq.ar },
              { icon: Building2, label: "الكيان", value: "غير ربحية" },
              { icon: Sparkles, label: "المنهج", value: "أزهري وسطي" },
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
            <span className="eyebrow">التوجهات</span>
            <h2 className="heading-section mt-3">الرؤية والرسالة</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-elegant p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-primary/5" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">رؤيتنا</h3>
                <p className="text-muted-foreground leading-loose">{vision.ar}</p>
              </div>
            </div>
            <div className="card-elegant p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-crimson/5" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-crimson/10 text-crimson mb-4">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">رسالتنا</h3>
                <p className="text-muted-foreground leading-loose">{mission.ar}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="eyebrow">قيمنا</span>
            <h2 className="heading-section mt-3">القيم التي نلتزم بها</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {values.map((v, i) => {
              const Icon = iconMap[v.icon] || Sparkles;
              return (
                <div key={i} className="card-elegant p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-sm">{v.ar}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORK AREAS — replaces homepage statistics */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="eyebrow">ميادين العمل</span>
            <h2 className="heading-section mt-3">مجالات عمل الاتحاد</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              يعمل اتحاد علماء الأزهر في خمسة مجالات رئيسية تخدم رسالته العلمية والدعوية والاجتماعية.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workAreas.map((f, i) => {
              const Icon = iconMap[f.icon] || Sparkles;
              return (
                <div key={i} className="card-elegant p-6 group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-emerald text-primary-foreground mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
              <span className="eyebrow">الأخبار</span>
              <h2 className="heading-section mt-3">آخر الأخبار والبيانات</h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/news">{ui.viewAll.ar} <ArrowLeft className="h-4 w-4" /></Link>
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
                      {n.category.ar}
                    </span>
                    <span>{n.date}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{n.title.ar}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{n.excerpt.ar}</p>
                  <div className="text-xs text-muted-foreground mb-3">
                    {ui.publishedBy.ar}: <span className="font-medium text-foreground/80">{n.publisher}</span>
                  </div>
                  <Link to="/news" className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
                    {ui.readMore.ar} <ArrowLeft className="h-4 w-4" />
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
              <span className="eyebrow">الفعاليات</span>
              <h2 className="heading-section mt-3">{ui.upcomingEvents.ar}</h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/events">{ui.viewAll.ar} <ArrowLeft className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {sampleEvents.filter(e => e.status === "upcoming").slice(0, 3).map((e, i) => (
              <article key={i} className="card-elegant p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-center bg-primary/10 text-primary rounded-xl px-3 py-2 min-w-[64px]">
                    <div className="text-2xl font-bold leading-none">{new Date(e.date).getDate()}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1">
                      {new Date(e.date).toLocaleDateString("ar-EG", { month: "short" })}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {e.type.ar}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{e.title.ar}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{e.description.ar}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {e.location.ar}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ui.organizedBy.ar}: <span className="font-medium text-foreground/80">{e.organizer}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LIBRARY + VIDEO PREVIEW */}
      <section className="section-padding">
        <div className="container-wide grid md:grid-cols-2 gap-6">
          <Link to="/library" className="card-elegant p-8 group block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-2">المكتبة الرقمية</h3>
            <p className="text-muted-foreground mb-4">
              كتب وبحوث وإصدارات الاتحاد متاحة للقراءة والتحميل.
            </p>
            <span className="text-primary font-semibold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              استكشف المكتبة <ArrowLeft className="h-4 w-4" />
            </span>
          </Link>
          <Link to="/videos" className="card-elegant p-8 group block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-crimson/10 text-crimson mb-5 group-hover:scale-110 transition-transform">
              <PlayCircle className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-2">المرئيات والبث المباشر</h3>
            <p className="text-muted-foreground mb-4">
              محاضرات ولقاءات وبثوث مباشرة تواكب أنشطة الاتحاد.
            </p>
            <span className="text-crimson font-semibold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              مشاهدة المرئيات <ArrowLeft className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* PARTNERSHIPS CTA */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-narrow">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-10 md:p-16 text-center">
            <div className="absolute inset-0 pattern-islamic opacity-20" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/80">
                الشراكات
              </span>
              <h2 className="heading-section mt-3 mb-4 max-w-2xl mx-auto">شراكاتنا المؤسسية</h2>
              <p className="text-primary-foreground/85 max-w-2xl mx-auto mb-8 leading-relaxed">
                {ui.partnerCta.ar}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <a href={`mailto:${site.email}`}>
                    <Mail className="h-4 w-4" /> {site.email}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                  <a href={site.facebook} target="_blank" rel="noreferrer">
                    <Facebook className="h-4 w-4" /> فيسبوك
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
