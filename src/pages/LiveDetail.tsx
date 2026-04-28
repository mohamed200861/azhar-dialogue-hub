import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Loader2, Radio, ExternalLink, Calendar } from "lucide-react";
import { formatDateTime, getYouTubeEmbed } from "@/lib/admin-utils";

export default function LiveDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!slug) return setLoading(false);
      let { data } = await supabase.from("live_streams").select("*").eq("slug", slug).maybeSingle();
      if (!data) {
        const r = await supabase.from("live_streams").select("*").eq("id", slug).maybeSingle();
        data = r.data;
      }
      setItem(data ?? null);
      if (data?.title) document.title = `${data.title} — اتحاد علماء الأزهر`;
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <SiteLayout><div className="section-padding text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div></SiteLayout>;
  }

  if (!item) {
    return (
      <SiteLayout>
        <PageHero eyebrow="بث مباشر" title="غير موجود" description="" />
        <section className="section-padding">
          <div className="container-narrow card-elegant p-10 text-center text-muted-foreground">
            البث المطلوب غير موجود أو تمت إزالته.
          </div>
        </section>
      </SiteLayout>
    );
  }

  const embed = item.embed_url || getYouTubeEmbed(item.live_url) || (item.status === "completed" ? getYouTubeEmbed(item.replay_url) : null);
  const statusLabel: Record<string, string> = {
    scheduled: "بث قادم",
    live: "مباشر الآن",
    completed: "تسجيل سابق",
    cancelled: "ملغي",
    draft: "مسودة",
  };

  return (
    <SiteLayout>
      <PageHero eyebrow="بث مباشر" title={item.title} description={item.description ?? ""} />
      <section className="section-padding">
        <div className="container-narrow">
          {item.status === "live" && (
            <div className="inline-flex items-center gap-2 text-red-600 text-sm font-semibold mb-3">
              <Radio className="h-4 w-4 animate-pulse" /> مباشر الآن
            </div>
          )}
          {item.status === "scheduled" && (
            <div className="inline-flex items-center gap-2 text-blue-600 text-sm font-semibold mb-3">
              <Calendar className="h-4 w-4" /> {statusLabel[item.status]} — {formatDateTime(item.scheduled_at)}
            </div>
          )}
          <div className="aspect-video rounded-2xl overflow-hidden border bg-black mb-6">
            {embed ? (
              <iframe src={embed} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={item.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Radio className="h-12 w-12 mx-auto mb-3" />
                  <div className="text-sm">{statusLabel[item.status] ?? "—"}</div>
                </div>
              </div>
            )}
          </div>
          {item.live_url && !embed && (
            <Button asChild variant="outline"><a href={item.live_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> فتح البث في {item.platform}</a></Button>
          )}
          {item.status === "completed" && item.replay_url && (
            <Button asChild className="ms-2"><a href={item.replay_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> مشاهدة التسجيل</a></Button>
          )}
          <div className="mt-8 text-sm text-muted-foreground">
            نُشر بواسطة: <span className="text-foreground/80">{item.publisher_source}</span>
          </div>
          <div className="mt-2"><Link to="/videos" className="text-primary hover:underline text-sm">← العودة إلى المرئيات</Link></div>
        </div>
      </section>
    </SiteLayout>
  );
}
