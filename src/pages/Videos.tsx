import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { SmartImage } from "@/components/SmartImage";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { PlayCircle, Radio, Calendar, Clock, Loader2 } from "lucide-react";
import { formatDateTime, formatDate, getYouTubeEmbed } from "@/lib/admin-utils";

const CATEGORIES = ["بث مباشر","محاضرات","لقاءات","دروس قصيرة","ندوات مسجلة","تسجيلات","برامج توعوية"];

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
  return (
    <div className="flex gap-3 mt-4 text-primary-foreground">
      {[[d, "يوم"], [h, "س"], [m, "د"], [s, "ث"]].map(([v, l], i) => (
        <div key={i} className="bg-white/15 rounded-lg px-3 py-2 min-w-[60px] text-center">
          <div className="text-xl font-bold">{v}</div>
          <div className="text-[10px]">{l}</div>
        </div>
      ))}
    </div>
  );
}

export default function VideosPage() {
  const [list, setList] = useState<any[] | null>(null);
  const [liveItems, setLiveItems] = useState<any[]>([]);
  const [cat, setCat] = useState<string | null>(null);

  const loadAll = async () => {
    const [vidsR, liveR] = await Promise.all([
      supabase.from("videos").select("*").eq("status", "published")
        .order("scheduled_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.from("live_streams").select("*")
        .in("status", ["scheduled", "live", "completed"])
        .eq("hide_from_videos", false)
        .order("scheduled_at", { ascending: false, nullsFirst: false }),
    ]);
    setList(vidsR.data ?? []);
    const now = Date.now();
    const valid = (liveR.data ?? []).filter((s: any) => !s.expires_at || new Date(s.expires_at).getTime() > now);
    setLiveItems(valid);
  };

  useEffect(() => {
    document.title = "المرئيات والبث المباشر — اتحاد علماء الأزهر";
    loadAll();
    const channel = supabase
      .channel("videos_live_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_streams" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const liveNow = useMemo(() => liveItems.find((s) => s.status === "live"), [liveItems]);
  const scheduled = useMemo(
    () => liveItems
      .filter((s) => s.status === "scheduled" && s.scheduled_at && new Date(s.scheduled_at) > new Date())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0],
    [liveItems]
  );
  const liveReplays = useMemo(
    () => liveItems.filter((s) => s.status === "completed" && s.replay_url).map((s) => ({
      id: `live-${s.id}`,
      slug: s.slug,
      title: s.title,
      thumbnail: s.thumbnail,
      category: "بث مباشر",
      scheduled_at: s.ended_at ?? s.scheduled_at,
      created_at: s.created_at,
      _isLive: true,
    })),
    [liveItems]
  );
  const replays = useMemo(() => {
    const v = (list ?? []).filter((x) => !(x.type === "live" && (x.live_status === "live" || x.live_status === "scheduled")));
    return [...liveReplays, ...v];
  }, [list, liveReplays]);
  const filtered = replays.filter((v: any) => !cat || v.category === cat);

  return (
    <SiteLayout>
      <PageHero eyebrow="المرئيات" title="المرئيات والبث المباشر"
        description="محاضرات ولقاءات وبثوث مباشرة من فعاليات الاتحاد." />

      <section className="section-padding">
        <div className="container-wide">
          {list === null ? (
            <div className="card-elegant p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : (
            <>
              <div className="card-elegant overflow-hidden grid lg:grid-cols-2 mb-12">
                {liveNow ? (
                  <div className="aspect-video lg:aspect-auto bg-black">
                    {liveNow.embed_url || getYouTubeEmbed(liveNow.video_url || "") ? (
                      <iframe src={liveNow.embed_url || getYouTubeEmbed(liveNow.video_url || "") || ""} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white"><Radio className="h-16 w-16" /></div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video lg:aspect-auto bg-gradient-hero flex flex-col items-center justify-center text-primary-foreground p-8 relative">
                    <div className="absolute inset-0 pattern-islamic opacity-20" />
                    <Radio className="h-16 w-16 mb-4 relative" />
                    <div className="text-xs uppercase tracking-[0.25em] mb-2 relative">البث المباشر</div>
                    <div className="text-2xl font-bold relative">{scheduled ? "بث قادم" : "غير متاح حاليًا"}</div>
                    {scheduled && <Countdown to={scheduled.scheduled_at} />}
                  </div>
                )}
                <div className="p-8 lg:p-10">
                  {liveNow ? (
                    <>
                      <div className="inline-flex items-center gap-2 text-crimson text-xs font-semibold mb-2">
                        <Radio className="h-4 w-4 animate-pulse" /> مباشر الآن
                      </div>
                      <h2 className="text-2xl font-bold mb-3">{liveNow.title}</h2>
                      <p className="text-muted-foreground leading-relaxed">{liveNow.description}</p>
                    </>
                  ) : scheduled ? (
                    <>
                      <h2 className="text-2xl font-bold mb-3">{scheduled.title}</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">{scheduled.description ?? ""}</p>
                      <div className="text-sm text-muted-foreground">موعد البث: <span className="font-medium text-foreground/80">{formatDateTime(scheduled.scheduled_at)}</span></div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold mb-3">لا يوجد بث حاليًا</h2>
                      <p className="text-muted-foreground leading-relaxed">لا يوجد بث مباشر حاليًا. تابعونا لمعرفة مواعيد البث القادمة.</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <Button variant={cat === null ? "default" : "outline"} size="sm" onClick={() => setCat(null)}>الكل</Button>
                {CATEGORIES.map((c) => (
                  <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>{c}</Button>
                ))}
              </div>

              <h2 className="heading-section mb-8">أحدث التسجيلات</h2>
              {filtered.length === 0 ? (
                <div className="card-elegant p-12 text-center text-muted-foreground">لا توجد مرئيات منشورة بعد.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filtered.map((v) => (
                    <Link key={v.id} to={`/videos/${v.slug || v.id}`} className="card-elegant overflow-hidden group block">
                      <div className="aspect-video relative">
                        <SmartImage src={v.thumbnail} alt={v.title} variant="video" className="w-full h-full object-cover" fallbackClassName="bg-gradient-emerald" />
                        {v.duration_seconds ? <span className="absolute bottom-2 end-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.floor(v.duration_seconds/60)}:{String(v.duration_seconds%60).padStart(2,"0")}</span> : null}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold mb-2 line-clamp-2">{v.title}</h3>
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(v.scheduled_at ?? v.created_at)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
