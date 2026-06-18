import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { applySeo } from "@/lib/seo";
import { getYouTubeEmbed } from "@/lib/admin-utils";
import { ArrowRight, Download, FileText, Music2 } from "lucide-react";
import { RichTextView } from "@/components/RichTextView";

export default function QuranDetail() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("quran_lessons").select("*").eq("slug", slug).eq("publish_status", "published").maybeSingle();
      setLesson(data);
      if (data?.teacher_id) {
        const { data: t } = await supabase.from("quran_teachers").select("*").eq("id", data.teacher_id).maybeSingle();
        setTeacher(t);
      }
      if (data) {
        const pageUrl = `/quran/${data.slug ?? slug}`;
        const img = (data as any).cover_image || (data as any).thumbnail || (data as any).featured_image || undefined;
        applySeo({
          title: `${data.title} — هيئة القرآن الكريم`,
          description: data.description ?? "",
          image: img,
          type: "article",
          url: pageUrl,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: data.title,
            headline: data.title,
            description: data.description || undefined,
            image: img ? [img] : undefined,
            datePublished: (data as any).published_at || data.created_at || undefined,
            inLanguage: "ar",
          },
        });
      }
    })();
  }, [slug]);

  if (!lesson) return <SiteLayout><div className="container-narrow py-20 text-center text-muted-foreground">جاري التحميل…</div></SiteLayout>;

  const embed = lesson.video_url ? getYouTubeEmbed(lesson.video_url) : null;

  return (
    <SiteLayout>
      <section className="container-narrow py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/quran"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
        <h1 className="heading-display mb-3">{lesson.title}</h1>
        {teacher && <p className="text-muted-foreground mb-6">المعلم: <strong className="text-foreground">{teacher.name}</strong></p>}

        {(embed || lesson.video_url) && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
            {embed ? <iframe src={embed} className="w-full h-full" allowFullScreen title={lesson.title} /> :
              <video controls src={lesson.video_url} className="w-full h-full" />}
          </div>
        )}

        {lesson.audio_url && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-2"><Music2 className="h-4 w-4" /> <span className="font-bold text-sm">الملف الصوتي</span></div>
            <audio controls src={lesson.audio_url} className="w-full" />
          </Card>
        )}

        {lesson.description && <p className="text-foreground/85 leading-loose mb-6">{lesson.description}</p>}
        {lesson.text_content && <RichTextView html={lesson.text_content} className="prose prose-sm max-w-none mb-6" />}

        {lesson.pdf_url && (
          <a href={lesson.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary font-bold">
            <FileText className="h-4 w-4" /> ملف PDF مرفق
          </a>
        )}

        {Array.isArray(lesson.attachments) && lesson.attachments.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="font-bold">مرفقات إضافية</h3>
            {lesson.attachments.map((a: any, i: number) => (
              <a key={i} href={a.url ?? a} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm">
                <Download className="h-4 w-4" /> {a.title ?? a.name ?? `مرفق ${i+1}`}
              </a>
            ))}
          </div>
        )}

        <div className="mt-10">
          <ReaderFeedback entityType="page" entityId={lesson.id} pagePath={`/quran/${lesson.slug}`} />
        </div>
      </section>
    </SiteLayout>
  );
}
