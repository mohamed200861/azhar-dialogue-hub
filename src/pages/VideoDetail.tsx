import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Calendar, PlayCircle, Radio, ExternalLink } from "lucide-react";
import { formatDateTime, formatDate, getYouTubeEmbed } from "@/lib/admin-utils";
import { applySeo } from "@/lib/seo";
import { RichTextView } from "@/components/RichTextView";
import { ReaderFeedback } from "@/components/ReaderFeedback";

const TYPE_LABEL: Record<string, string> = { video: "فيديو مسجل", live: "بث مباشر", recording: "تسجيل" };
const LIVE_LABEL: Record<string, string> = { scheduled: "بث قادم", live: "مباشر الآن", completed: "تسجيل سابق", cancelled: "ملغي" };

export default function VideoDetail() {
  const { slug } = useParams();
  const [video, setVideo] = useState<any | null | undefined>(undefined);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
      const q = supabase.from("videos").select("*").eq("status", "published");
      const { data } = isUuid
        ? await q.eq("id", slug).maybeSingle()
        : await q.eq("slug", slug).maybeSingle();
      if (!data) { setVideo(null); return; }
      setVideo(data);
      applySeo({
        title: data.title,
        description: data.description,
        image: data.thumbnail || undefined,
        type: "article",
      });
      const { data: rel } = await supabase
        .from("videos").select("id,slug,title,thumbnail,category,scheduled_at,created_at")
        .eq("status", "published").eq("category", data.category).neq("id", data.id).limit(3);
      setRelated(rel ?? []);
    })();
  }, [slug]);

  if (video === undefined) return <SiteLayout><div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div></SiteLayout>;
  if (video === null) return <SiteLayout><div className="container-narrow py-20 text-center">
    <h1 className="text-2xl font-bold mb-4">العنصر غير موجود أو لم يعد متاحًا.</h1>
    <Button asChild><Link to="/videos">العودة إلى المرئيات</Link></Button>
  </div></SiteLayout>;

  const embed = video.embed_url || getYouTubeEmbed(video.video_url);
  const hasAnyVideo = !!(embed || video.video_url);

  return (
    <SiteLayout>
      <article className="container-wide py-12 md:py-16">
        <Button variant="ghost" asChild className="mb-4"><Link to="/videos"><ArrowRight className="h-4 w-4" /> المرئيات والبث المباشر</Link></Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card-elegant overflow-hidden mb-6">
              <div className="aspect-video bg-black">
                {embed ? (
                  <iframe
                    src={embed}
                    title={video.title}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.video_url ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
                    <PlayCircle className="h-16 w-16 opacity-80" />
                    <p className="text-sm opacity-90">لا يمكن تضمين هذا الفيديو هنا.</p>
                    <Button asChild variant="secondary">
                      <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> مشاهدة الفيديو
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/80">
                    لا يوجد فيديو متاح حاليًا.
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">{video.title}</h1>
            {video.type === "live" && video.live_status === "live" && (
              <div className="inline-flex items-center gap-2 text-crimson text-sm font-semibold mb-4">
                <Radio className="h-4 w-4 animate-pulse" /> مباشر الآن
              </div>
            )}
            {video.description && <RichTextView html={video.description} className="rich-content text-muted-foreground leading-loose" />}

            {!hasAnyVideo && video.thumbnail && (
              <div className="mt-6 rounded-xl overflow-hidden aspect-video">
                <SmartImage src={video.thumbnail} alt={video.title} variant="video" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card-elegant p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">النوع</span><span className="font-medium">{TYPE_LABEL[video.type] ?? video.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">التصنيف</span><span className="font-medium">{video.category}</span></div>
              {video.platform && <div className="flex justify-between"><span className="text-muted-foreground">المنصة</span><span className="font-medium">{video.platform}</span></div>}
              {video.live_status && <div className="flex justify-between"><span className="text-muted-foreground">حالة البث</span><span className="font-medium">{LIVE_LABEL[video.live_status] ?? video.live_status}</span></div>}
              {video.scheduled_at && <div className="flex justify-between"><span className="text-muted-foreground">تاريخ البث</span><span className="font-medium">{formatDateTime(video.scheduled_at)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">جهة النشر</span><span className="font-medium">{video.publisher_source}</span></div>
              {video.video_url && (
                <div className="pt-3 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> مشاهدة على المنصة
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t">
            <h2 className="text-xl font-bold mb-6">مرئيات ذات صلة</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to={`/videos/${r.slug || r.id}`} className="card-elegant overflow-hidden block hover:bg-muted/20">
                  <div className="aspect-video">
                    <SmartImage src={r.thumbnail} alt={r.title} variant="video" className="w-full h-full object-cover" fallbackClassName="bg-gradient-emerald" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-primary mb-1">{r.category}</div>
                    <h3 className="font-semibold line-clamp-2 mb-2">{r.title}</h3>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(r.scheduled_at ?? r.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        <div className="container-narrow">
          <ReaderFeedback entityType="video" entityId={video.id} pagePath={`/videos/${video.slug || video.id}`} />
        </div>
      </article>
    </SiteLayout>
  );
}
