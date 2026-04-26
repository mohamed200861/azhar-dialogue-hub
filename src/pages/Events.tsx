import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Tag, Loader2, Radio } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/admin-utils";

const TYPES = ["مؤتمرات","ندوات","دورات","لقاءات","محاضرات","بث مباشر"];

export default function EventsPage() {
  const [events, setEvents] = useState<any[] | null>(null);
  const [tab, setTab] = useState<"upcoming" | "live" | "past">("upcoming");
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    document.title = "الفعاليات — اتحاد علماء الأزهر";
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("publish_status", "published").order("start_datetime", { ascending: false });
      setEvents(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    return (events ?? []).filter((e) => {
      const matchTab = tab === "upcoming" ? e.status === "upcoming" : tab === "live" ? e.status === "live" : e.status === "completed";
      const matchType = !type || e.event_type === type;
      return matchTab && matchType;
    });
  }, [events, tab, type]);

  return (
    <SiteLayout>
      <PageHero eyebrow="الفعاليات" title="فعاليات الاتحاد"
        description="مؤتمرات وندوات ودورات ولقاءات علمية ودعوية." />

      <section className="section-padding">
        <div className="container-wide">
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant={tab === "upcoming" ? "default" : "outline"} onClick={() => setTab("upcoming")}>الفعاليات القادمة</Button>
            <Button variant={tab === "live" ? "default" : "outline"} onClick={() => setTab("live")}>
              <Radio className="h-4 w-4" /> مباشرة الآن
            </Button>
            <Button variant={tab === "past" ? "default" : "outline"} onClick={() => setTab("past")}>الفعاليات السابقة</Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-10">
            <Button variant={type === null ? "default" : "outline"} size="sm" onClick={() => setType(null)}>كل الأنواع</Button>
            {TYPES.map((t) => (
              <Button key={t} variant={type === t ? "default" : "outline"} size="sm" onClick={() => setType(t)}>{t}</Button>
            ))}
          </div>

          {events === null ? (
            <div className="card-elegant p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="card-elegant p-12 text-center text-muted-foreground">لا توجد فعاليات في هذا التصنيف حاليًا.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((e) => (
                <article key={e.id} className="card-elegant overflow-hidden flex flex-col">
                  {e.cover_image && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={e.cover_image} alt={e.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-center bg-primary/10 text-primary rounded-xl px-3 py-2 min-w-[68px]">
                        <div className="text-2xl font-bold leading-none">{new Date(e.start_datetime).getDate()}</div>
                        <div className="text-[10px] uppercase tracking-wider mt-1">
                          {new Date(e.start_datetime).toLocaleDateString("ar-EG", { month: "short" })}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {e.event_type}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{e.title}</h3>
                    {e.description && <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">{e.description}</p>}
                    <div className="text-xs text-muted-foreground space-y-1 mb-1">
                      {e.location && <div className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.location}</div>}
                      <div className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDateTime(e.start_datetime)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">نُظّم بواسطة: <span className="font-medium text-foreground/80">{e.organizer_source}</span></div>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {e.status === "upcoming" && e.registration_link && <Button size="sm" asChild className="flex-1"><a href={e.registration_link} target="_blank" rel="noreferrer">التسجيل</a></Button>}
                      {e.status === "live" && e.live_link && <Button size="sm" asChild className="flex-1"><a href={e.live_link} target="_blank" rel="noreferrer">مشاهدة البث</a></Button>}
                      {e.status === "completed" && e.replay_link && <Button size="sm" variant="outline" asChild className="flex-1"><a href={e.replay_link} target="_blank" rel="noreferrer">مشاهدة التسجيل</a></Button>}
                      {e.online_link && <Button size="sm" variant="outline" asChild><a href={e.online_link} target="_blank" rel="noreferrer">رابط الحضور</a></Button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
