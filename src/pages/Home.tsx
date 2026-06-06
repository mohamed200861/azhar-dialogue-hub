import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Calendar, BookOpen, Newspaper, PlayCircle, Radio,
  Scale, GitFork, ShieldCheck, Building2, HeartHandshake, Megaphone,
  GraduationCap, Tv, Users, Sparkles, MapPin, Mail, Facebook, Loader2,
  Gavel, MessageCircle, FileText, Award,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import {
  hero, about, vision, mission, values, workAreas, ui, site,
} from "@/i18n/content";
import { Button } from "@/components/ui/button";
import logoDefault from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatDate, formatDateTime, getYouTubeEmbed } from "@/lib/admin-utils";
import { SmartImage } from "@/components/SmartImage";
import { NewsTicker } from "@/components/NewsTicker";
import { Skeleton } from "@/components/ui/skeleton";


import { applySeo } from "@/lib/seo";

function LiveCountdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
  return (
    <div className="flex gap-2 mt-3">
      {[[d, "يوم"], [h, "س"], [m, "د"], [s, "ث"]].map(([v, l], i) => (
        <div key={i} className="bg-white/15 rounded-lg px-3 py-1.5 min-w-[56px] text-center text-primary-foreground">
          <div className="text-lg font-bold leading-none">{v}</div>
          <div className="text-[10px] mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  );
}

const iconMap: Record<string, any> = {
  Scale, GitFork, BookOpen, ShieldCheck, Building2, HeartHandshake,
  Megaphone, GraduationCap, Users, Tv,
};

export default function Home() {
  const { settings } = useSiteSettings();
  const logo = settings.logo_url || logoDefault;

  const [news, setNews] = useState<any[] | null>(null);
  const [events, setEvents] = useState<any[] | null>(null);
  const [library, setLibrary] = useState<any[] | null>(null);
  const [videos, setVideos] = useState<any[] | null>(null);
  const [liveNow, setLiveNow] = useState<any | null>(null);
  const [liveScheduled, setLiveScheduled] = useState<any | null>(null);

  useEffect(() => {
    applySeo({
      title: settings.seo_title || `${settings.site_name || site.name.ar} — ${settings.site_slogan || site.slogan.ar}`,
      description: settings.seo_description || hero.description,
    });
  }, [settings]);

  const loadLive = async () => {
    const { data } = await supabase
      .from("live_streams")
      .select("*")
      .in("status", ["live", "scheduled"])
      .eq("hide_from_homepage", false)
      .order("scheduled_at", { ascending: true, nullsFirst: false });
    const now = Date.now();
    const valid = (data ?? []).filter((s: any) => !s.expires_at || new Date(s.expires_at).getTime() > now);
    // Auto-promote: scheduled streams whose scheduled_at has passed are treated as live
    const isEffectivelyLive = (s: any) =>
      s.status === "live" ||
      (s.status === "scheduled" && s.scheduled_at && new Date(s.scheduled_at).getTime() <= now);
    const live = valid.find(isEffectivelyLive) ?? null;
    const scheduled = !live
      ? valid.find((s: any) => s.status === "scheduled" && s.scheduled_at && new Date(s.scheduled_at).getTime() > now) ?? null
      : null;
    setLiveNow(live);
    setLiveScheduled(scheduled);
  };

  // Re-evaluate live/scheduled state every 30s so a scheduled stream auto-promotes when its time arrives
  useEffect(() => {
    const t = setInterval(() => loadLive(), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const [newsR, eventsR, libR, vidsR] = await Promise.all([
        supabase.from("news_posts").select("id,slug,title,excerpt,cover_image,category,publisher_source,published_at,created_at")
          .eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(5),
        supabase.from("events").select("id,slug,title,description,cover_image,event_type,start_datetime,location,status,organizer_source")
          .eq("publish_status", "published").eq("status", "upcoming").order("start_datetime", { ascending: true }).limit(3),
        supabase.from("library_items").select("id,slug,title,category,cover_image,publisher_source,description")
          .eq("status", "published").order("is_featured", { ascending: false })
          .order("published_at", { ascending: false, nullsFirst: false }).limit(4),
        supabase.from("videos").select("id,slug,title,thumbnail,video_url,embed_url,scheduled_at,created_at,type,live_status,category")
          .eq("status", "published").order("scheduled_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }).limit(4),
      ]);
      setNews(newsR.data ?? []);
      setEvents(eventsR.data ?? []);
      setLibrary(libR.data ?? []);
      setVideos(vidsR.data ?? []);
      await loadLive();
    })();

    const channel = supabase
      .channel("home_live_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_streams" }, () => { loadLive(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 pattern-islamic opacity-25" />
        <div className="absolute top-1/4 end-0 w-[500px] h-[500px] rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="absolute bottom-0 start-1/4 w-[400px] h-[400px] rounded-full bg-crimson/10 blur-3xl" />

        <div className="container-wide relative py-10 md:py-14 lg:py-16 grid lg:grid-cols-[1.3fr,1fr] gap-10 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              مؤسسة إسلامية دعوية علمية
            </div>
            <h1 className="heading-display mb-5">{settings.site_name || hero.title}</h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-3 font-normal">
              {settings.site_slogan || hero.subtitle}
            </p>
            <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl leading-relaxed">
              {hero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to={hero.buttons.primary.href}>
                  {hero.buttons.primary.label}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                <Link to={hero.buttons.secondary.href}>{hero.buttons.secondary.label}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                <Link to={hero.buttons.tertiary.href}>{hero.buttons.tertiary.label}</Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-glow/30 to-crimson/20 blur-3xl scale-110" />
              <div className="relative bg-white/95 rounded-[2rem] p-10 shadow-elegant">
                <img src={logo} alt={settings.site_name || site.name.ar} className="w-72 h-72 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWS TICKER */}
      <NewsTicker />

      {/* LIVE */}
      {(liveNow || liveScheduled) && (
        <section className="bg-gradient-to-l from-red-700 via-red-600 to-red-700 text-white border-y-4 border-red-800">
          <div className="container-wide py-8">
            {liveNow ? (
              <div className="grid lg:grid-cols-[1.1fr,1fr] gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-3">
                    <Radio className="h-3.5 w-3.5 animate-pulse" /> مباشر الآن
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">البث المباشر الآن</h2>
                  <p className="text-base md:text-lg text-white/90 mb-1">{liveNow.title}</p>
                  {liveNow.description && <p className="text-sm text-white/80 line-clamp-2 mb-4">{liveNow.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="lg" className="bg-white text-red-700 hover:bg-white/90 font-bold">
                      <Link to={`/live/${liveNow.slug || liveNow.id}`}>
                        <PlayCircle className="h-5 w-5" /> مشاهدة البث
                      </Link>
                    </Button>
                    {liveNow.live_url && (
                      <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                        <a href={liveNow.live_url} target="_blank" rel="noreferrer">فتح في {liveNow.platform}</a>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl">
                  {(liveNow.embed_url || getYouTubeEmbed(liveNow.live_url || "")) ? (
                    <iframe
                      src={liveNow.embed_url || getYouTubeEmbed(liveNow.live_url || "") || ""}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={liveNow.title}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <Radio className="h-12 w-12" />
                      <Button asChild className="bg-white text-red-700 hover:bg-white/90">
                        <Link to={`/live/${liveNow.slug || liveNow.id}`}>مشاهدة البث</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : liveScheduled ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
                    <Calendar className="h-3.5 w-3.5" /> بث مباشر قادم
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1">{liveScheduled.title}</h2>
                  <p className="text-sm text-white/80">{liveScheduled.scheduled_at ? formatDateTime(liveScheduled.scheduled_at) : ""}</p>
                  {liveScheduled.scheduled_at && <LiveCountdown to={liveScheduled.scheduled_at} />}
                </div>
                <Button asChild size="lg" className="bg-white text-red-700 hover:bg-white/90 font-bold">
                  <Link to={`/live/${liveScheduled.slug || liveScheduled.id}`}>
                    <PlayCircle className="h-5 w-5" /> تفاصيل البث
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* LATEST NEWS — moved up, right below hero/ticker/live */}
      {settings.show_news_section !== false && (
        <section className="section-padding bg-gradient-soft">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <span className="eyebrow">الأخبار</span>
                <h2 className="heading-section mt-3">آخر الأخبار والبيانات</h2>
              </div>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link to="/news">{ui.viewAll} <ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="min-h-[420px]">
              {news === null ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`card-elegant overflow-hidden ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}
                    >
                      <Skeleton className={`${i === 0 ? "aspect-[16/9]" : "aspect-[16/10]"} w-full rounded-none`} />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : news.length === 0 ? (
                <div className="card-elegant p-12 text-center text-muted-foreground">
                  لا توجد أخبار منشورة حاليًا. ترقبوا المحتوى الجديد قريبًا.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-fr">
                  {news.map((n, idx) => {
                    const featured = idx === 0 && news.length >= 3;
                    return (
                      <Link
                        key={n.id}
                        to={`/news/${n.slug || n.id}`}
                        className={`card-elegant overflow-hidden flex flex-col group ${
                          featured ? "lg:col-span-2 lg:row-span-2" : ""
                        }`}
                      >
                        <div className={`${featured ? "aspect-[16/9]" : "aspect-[16/10]"} overflow-hidden bg-muted`}>
                          <SmartImage
                            src={n.cover_image}
                            alt={n.title}
                            variant="news"
                            fallbackClassName="bg-gradient-emerald"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading={featured ? "eager" : "lazy"}
                            decoding="async"
                            {...(featured ? { fetchpriority: "high" as any } : {})}
                          />
                        </div>
                        <div className={`${featured ? "p-6" : "p-4"} flex flex-col flex-1`}>
                          <div className="flex items-center gap-2 text-[11px] md:text-xs text-muted-foreground mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{n.category}</span>
                            <span>{formatDate(n.published_at ?? n.created_at)}</span>
                          </div>
                          <h3 className={`font-bold mb-2 line-clamp-2 leading-snug ${featured ? "text-xl md:text-2xl" : "text-base md:text-[17px]"}`}>
                            {n.title}
                          </h3>
                          {n.excerpt && (
                            <p className={`text-muted-foreground mb-3 flex-1 ${featured ? "text-sm md:text-base line-clamp-4" : "text-[13px] line-clamp-2"}`}>
                              {n.excerpt}
                            </p>
                          )}
                          <span className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all mt-auto">
                            {ui.readMore} <ArrowLeft className="h-4 w-4" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SPECIALIZED SECTIONS */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-10">
            <span className="eyebrow">أقسام متخصصة</span>
            <h2 className="heading-section mt-3">خدمات وأقسام الاتحاد</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              أقسام علمية ودعوية ومجتمعية متخصصة، تخدم رسالة الاتحاد في نشر العلم وتقديم الخدمات الشرعية.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Gavel, title: "الفتوى والتحكيم الشرعي", desc: "قسم يقدّم الفتاوى والتحكيم في النزاعات الأسرية والمالية وفق الشريعة الإسلامية بمنهج وسطي، سعيًا للإصلاح وتحقيق العدالة.", cta: "اطلب الفتوى أو التحكيم", href: "/fatwa-arbitration" },
              { icon: GraduationCap, title: "أكاديمية العلوم الشرعية", desc: "برامج تعليمية متخصصة في العلوم الشرعية: دورات ودبلومات وإجازات علمية، وفق منهج رصين لتأهيل كوادر علمية متميزة.", cta: "تعرّف على البرامج", href: "/sharia-academy" },
              { icon: MessageCircle, title: "الحوار والتواصل الحضاري", desc: "تعزيز الحوار بين الأديان والثقافات، وترسيخ قيم التفاهم والتعايش وفق رؤية إسلامية وسطية.", cta: "اقرأ المزيد", href: "/civilizational-dialogue" },
              { icon: FileText, title: "البحوث والدراسات", desc: "إنتاج ونشر البحوث والدراسات الشرعية والفكرية المتخصصة، وتحليل القضايا المعاصرة بمنهج علمي رصين.", cta: "استكشف البحوث", href: "/research-studies" },
            ].map((s, i) => (
              <div key={i} className="card-elegant p-6 flex flex-col">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-emerald text-primary-foreground mb-4 shadow-elegant">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-lg mb-2 leading-snug">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.desc}</p>
                <Button asChild variant="outline" className="mt-4 self-start">
                  <Link to={s.href}>{s.cta} <ArrowLeft className="h-4 w-4" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* LIBRARY + VIDEOS */}
      <section className="section-padding">
        <div className="container-wide grid md:grid-cols-2 gap-6">
          <div className="card-elegant p-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-2">المكتبة الرقمية</h3>
            <p className="text-muted-foreground mb-4">كتب وبحوث وإصدارات الاتحاد متاحة للقراءة والتحميل.</p>
            {library && library.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {library.slice(0, 3).map((b) => (
                  <li key={b.id}>
                    <Link to={`/library/${b.slug || b.id}`} className="text-sm hover:text-primary line-clamp-1">• {b.title}</Link>
                  </li>
                ))}
              </ul>
            ) : library !== null ? (
              <p className="text-xs text-muted-foreground mb-4">سيتم إضافة المحتوى قريبًا.</p>
            ) : null}
            <Link to="/library" className="text-primary font-semibold inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
              استكشف المكتبة <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="card-elegant p-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-crimson/10 text-crimson mb-5">
              {liveNow ? <Radio className="h-7 w-7 animate-pulse" /> : <PlayCircle className="h-7 w-7" />}
            </div>
            <h3 className="text-2xl font-bold mb-2">المرئيات والبث المباشر</h3>
            {liveNow ? (
              <>
                <div className="inline-flex items-center gap-1 text-crimson text-xs font-semibold mb-2">
                  <Radio className="h-3 w-3 animate-pulse" /> مباشر الآن
                </div>
                <Link to={`/videos/${liveNow.slug || liveNow.id}`} className="block text-base font-semibold mb-3 hover:text-primary line-clamp-2">
                  {liveNow.title}
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground mb-4">محاضرات ولقاءات وبثوث مباشرة تواكب أنشطة الاتحاد.</p>
            )}
            {videos && videos.length > 0 && (
              <ul className="space-y-1 mb-4">
                {videos.slice(0, 3).map((v) => (
                  <li key={v.id}>
                    <Link to={`/videos/${v.slug || v.id}`} className="text-sm hover:text-primary line-clamp-1">• {v.title}</Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/videos" className="text-crimson font-semibold inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
              مشاهدة المرئيات <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW DEPARTMENTS — Membership / Quran / Khutbahs */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="text-center mb-8">
            <span className="eyebrow">أقسام جديدة</span>
            <h2 className="heading-section mt-3">العضوية والقرآن والخطب</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Award, title: "العضوية", desc: "انضم إلى اتحاد علماء الأزهر واستفد من البرامج والخدمات والأنشطة العلمية والدعوية.", primary: { label: "تقديم طلب عضوية", href: "/memberships" }, secondary: { label: "أنواع العضوية", href: "/memberships#types" } },
              { icon: BookOpen, title: "هيئة القرآن الكريم", desc: "دورات ودروس ومواد تعليمية متخصصة في القرآن الكريم والتجويد والتفسير.", primary: { label: "استعراض الدورات", href: "/quran" }, secondary: { label: "مشاهدة الدروس", href: "/quran" } },
              { icon: Megaphone, title: "خطب وخطباء", desc: "مجموعة من الخطب والمحاضرات والدروس الدعوية لكبار الخطباء والدعاة.", primary: { label: "مشاهدة الخطب", href: "/khutbahs" }, secondary: { label: "عرض الخطباء", href: "/khutbahs" } },
            ].map((s, i) => (
              <div key={i} className="card-elegant p-6 flex flex-col">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-emerald text-primary-foreground mb-3 shadow-elegant">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{s.desc}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm"><Link to={s.primary.href}>{s.primary.label}</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to={s.secondary.href}>{s.secondary.label}</Link></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* UPCOMING EVENTS */}
      {settings.show_events_section !== false && (
        <section className="section-padding bg-gradient-soft">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <span className="eyebrow">الفعاليات</span>
                <h2 className="heading-section mt-3">{ui.upcomingEvents}</h2>
              </div>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link to="/events">{ui.viewAll} <ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            </div>
            {events === null ? (
              <div className="card-elegant p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : events.length === 0 ? (
              <div className="card-elegant p-12 text-center text-muted-foreground">
                لا توجد فعاليات قادمة حاليًا.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {events.map((e) => (
                  <Link key={e.id} to={`/events/${e.slug || e.id}`} className="card-elegant p-6 block hover:shadow-elegant transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-center bg-primary/10 text-primary rounded-xl px-3 py-2 min-w-[64px]">
                        <div className="text-2xl font-bold leading-none">{new Date(e.start_datetime).getDate()}</div>
                        <div className="text-[10px] uppercase tracking-wider mt-1">
                          {new Date(e.start_datetime).toLocaleDateString("ar-EG", { month: "short" })}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{e.event_type}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{e.title}</h3>
                    {e.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{e.description}</p>}
                    {e.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {e.location}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {ui.organizedBy}: <span className="font-medium text-foreground/80">{e.organizer_source}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}


      {/* QUICK LINKS — replaces vision/values/work-areas heavy blocks */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="text-center mb-10">
            <span className="eyebrow">روابط مهمة</span>
            <h2 className="heading-section mt-3">استكشف أقسام الاتحاد</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, title: "المكتبة", desc: "كتب وإصدارات الاتحاد متاحة للقراءة والتحميل.", href: "/library" },
              { icon: FileText, title: "البحوث والدراسات", desc: "بحوث ودراسات شرعية وفكرية معاصرة.", href: "/research-studies" },
              { icon: GraduationCap, title: "أكاديمية العلوم الشرعية", desc: "برامج تعليمية ودبلومات وإجازات.", href: "/sharia-academy" },
              { icon: MessageCircle, title: "الحوار والتواصل الحضاري", desc: "تعزيز الحوار بين الأديان والثقافات.", href: "/civilizational-dialogue" },
              { icon: Gavel, title: "الفتوى والتحكيم الشرعي", desc: "فتاوى وتحكيم وفق منهج وسطي.", href: "/fatwa-arbitration" },
              { icon: PlayCircle, title: "المرئيات", desc: "محاضرات ولقاءات وبثوث الاتحاد.", href: "/videos" },
              { icon: Calendar, title: "الفعاليات", desc: "آخر الفعاليات والمؤتمرات.", href: "/events" },
              { icon: Mail, title: "النشرة البريدية", desc: "اشترك لتصلك أهم الأخبار.", href: "/newsletter" },
            ].map((q, i) => (
              <Link key={i} to={q.href} className="card-elegant p-5 flex flex-col group hover:shadow-elegant transition-shadow">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary mb-3">
                  <q.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold mb-1">{q.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{q.desc}</p>
                <span className="text-xs font-semibold text-primary mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  زيارة <ArrowLeft className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERSHIPS CTA — moved to bottom */}
      <section className="py-16 md:py-20">
        <div className="container-narrow">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-10 md:p-14 text-center">
            <div className="absolute inset-0 pattern-islamic opacity-20" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/80">الشراكات</span>
              <h2 className="heading-section mt-3 mb-4 max-w-2xl mx-auto">شراكاتنا المؤسسية</h2>
              <p className="text-primary-foreground/85 max-w-2xl mx-auto mb-8 leading-relaxed">{ui.partnerCta}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <a href={`mailto:${settings.contact_email}`}>
                    <Mail className="h-4 w-4" /> {settings.contact_email}
                  </a>
                </Button>
                {settings.facebook_url && (
                  <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                    <a href={settings.facebook_url} target="_blank" rel="noreferrer">
                      <Facebook className="h-4 w-4" /> فيسبوك
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
