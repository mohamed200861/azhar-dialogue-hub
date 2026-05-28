import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { SmartImage } from "@/components/SmartImage";
import { applySeo } from "@/lib/seo";
import { getYouTubeEmbed, formatDate } from "@/lib/admin-utils";
import { ArrowRight, Calendar, MapPin, Mic, Music2 } from "lucide-react";

export default function KhutbahDetail() {
  const { slug } = useParams();
  const [k, setK] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("khutbahs").select("*").eq("slug", slug).eq("publish_status", "published").maybeSingle();
      setK(data);
      if (data) applySeo({ title: `${data.title} — خطب`, description: data.description ?? "" });
    })();
  }, [slug]);

  if (!k) return <SiteLayout><div className="container-narrow py-20 text-center text-muted-foreground">جاري التحميل…</div></SiteLayout>;

  const embed = k.video_url ? getYouTubeEmbed(k.video_url) : null;

  return (
    <SiteLayout>
      <section className="container-narrow py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/khutbahs"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
        <h1 className="heading-display mb-3">{k.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
          {k.speaker_name && <span className="inline-flex items-center gap-1.5"><Mic className="h-4 w-4" /> {k.speaker_name}</span>}
          {k.khutbah_date && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(k.khutbah_date)}</span>}
          {(k.mosque || k.location) && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {[k.mosque, k.location].filter(Boolean).join(" — ")}</span>}
        </div>

        {k.featured_image && !embed && !k.video_url && (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-6">
            <SmartImage src={k.featured_image} alt={k.title} variant="news" className="w-full h-full object-cover" />
          </div>
        )}

        {(embed || k.video_url) && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
            {embed ? <iframe src={embed} className="w-full h-full" allowFullScreen title={k.title} /> :
              <video controls src={k.video_url} className="w-full h-full" />}
          </div>
        )}

        {k.audio_url && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-2"><Music2 className="h-4 w-4" /> <span className="font-bold text-sm">الملف الصوتي</span></div>
            <audio controls src={k.audio_url} className="w-full" />
          </Card>
        )}

        {k.description && <p className="text-foreground/85 leading-loose mb-6">{k.description}</p>}
        {k.transcript && (
          <Card className="p-5 prose prose-sm max-w-none whitespace-pre-wrap leading-loose">
            <h3>نص الخطبة</h3>
            <div>{k.transcript}</div>
          </Card>
        )}

        <div className="mt-10">
          <ReaderFeedback entityType="page" entityId={k.id} pagePath={`/khutbahs/${k.slug}`} />
        </div>
      </section>
    </SiteLayout>
  );
}
