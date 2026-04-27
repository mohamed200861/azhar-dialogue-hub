import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Calendar, MapPin, Tag, Radio, ExternalLink } from "lucide-react";
import { formatDateTime, formatDate, isValidUrl } from "@/lib/admin-utils";

const STATUS_LABEL: Record<string, string> = {
  upcoming: "قادم",
  live: "مباشر",
  completed: "مكتمل",
  cancelled: "ملغي",
};
const STATUS_BG: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  live: "bg-crimson/10 text-crimson",
  completed: "bg-muted text-foreground/70",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function EventDetail() {
  const { slug } = useParams();
  const [event, setEvent] = useState<any | null | undefined>(undefined);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
      const q = supabase.from("events").select("*").eq("publish_status", "published");
      const { data } = isUuid
        ? await q.eq("id", slug).maybeSingle()
        : await q.eq("slug", slug).maybeSingle();
      if (!data) { setEvent(null); return; }
      setEvent(data);
      document.title = `${data.title} — فعاليات الاتحاد`;
      const { data: rel } = await supabase
        .from("events").select("id,slug,title,cover_image,event_type,start_datetime,location,status")
        .eq("publish_status", "published").neq("id", data.id)
        .order("start_datetime", { ascending: false }).limit(3);
      setRelated(rel ?? []);
    })();
  }, [slug]);

  if (event === undefined) return <SiteLayout><div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div></SiteLayout>;
  if (event === null) return <SiteLayout><div className="container-narrow py-20 text-center">
    <h1 className="text-2xl font-bold mb-4">العنصر غير موجود أو لم يعد متاحًا.</h1>
    <Button asChild><Link to="/events">العودة إلى الفعاليات</Link></Button>
  </div></SiteLayout>;

  const showLink = (u: string | null | undefined) => !!u && isValidUrl(u);

  return (
    <SiteLayout>
      <article className="container-wide py-12 md:py-16">
        <Button variant="ghost" asChild className="mb-4"><Link to="/events"><ArrowRight className="h-4 w-4" /> فعاليات الاتحاد</Link></Button>

        {event.cover_image && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-[16/9]">
            <SmartImage src={event.cover_image} alt={event.title} variant="event" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"><Tag className="h-3 w-3" /> {event.event_type}</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${STATUS_BG[event.status] ?? "bg-muted"}`}>
                {event.status === "live" && <Radio className="h-3 w-3 animate-pulse" />}
                {STATUS_LABEL[event.status] ?? event.status}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{event.title}</h1>
            {event.description && <div className="text-muted-foreground leading-loose whitespace-pre-line">{event.description}</div>}
          </div>

          <div className="lg:col-span-1">
            <div className="card-elegant p-5 space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">التاريخ</div>
                <div className="font-medium inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDateTime(event.start_datetime)}</div>
                {event.end_datetime && <div className="text-xs text-muted-foreground mt-1">حتى: {formatDateTime(event.end_datetime)}</div>}
              </div>
              {event.location && (
                <div>
                  <div className="text-muted-foreground mb-1">المكان</div>
                  <div className="font-medium inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground mb-1">جهة التنظيم</div>
                <div className="font-medium">{event.organizer_source}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">نوع الفعالية</div>
                <div className="font-medium">{event.event_type}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">الحالة</div>
                <div className="font-medium">{STATUS_LABEL[event.status] ?? event.status}</div>
              </div>

              <div className="pt-3 border-t flex flex-col gap-2">
                {event.status === "upcoming" && event.registration_link && (
                  <Button asChild className="w-full"><a href={event.registration_link} target="_blank" rel="noreferrer">التسجيل</a></Button>
                )}
                {event.online_link && (
                  <Button asChild variant="outline" className="w-full"><a href={event.online_link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> رابط الحضور</a></Button>
                )}
                {event.status === "live" && event.live_link && (
                  <Button asChild className="w-full"><a href={event.live_link} target="_blank" rel="noreferrer"><Radio className="h-4 w-4" /> مشاهدة البث</a></Button>
                )}
                {event.status === "completed" && event.replay_link && (
                  <Button asChild variant="outline" className="w-full"><a href={event.replay_link} target="_blank" rel="noreferrer">مشاهدة التسجيل</a></Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t">
            <h2 className="text-xl font-bold mb-6">فعاليات ذات صلة</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to={`/events/${r.slug || r.id}`} className="card-elegant p-4 hover:bg-muted/20 block">
                  <div className="text-xs text-primary mb-2">{r.event_type}</div>
                  <h3 className="font-bold line-clamp-2 mb-2">{r.title}</h3>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(r.start_datetime)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
}
