import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Calendar, Download, FileText } from "lucide-react";
import { formatDate, fileNameFromUrl, resolveStorageUrl } from "@/lib/admin-utils";
import { applySeo } from "@/lib/seo";
import { RichTextView } from "@/components/RichTextView";
import { ReaderFeedback } from "@/components/ReaderFeedback";

export default function NewsDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState<any | null | undefined>(undefined);
  const [related, setRelated] = useState<any[]>([]);
  const [signedPdf, setSignedPdf] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
      const q = supabase.from("news_posts").select("*").eq("status", "published");
      const { data } = isUuid
        ? await q.eq("id", slug).maybeSingle()
        : await q.eq("slug", slug).maybeSingle();
      if (!data) {
        setPost(null);
        return;
      }
      setPost(data);
      const pageUrl = `https://alazharscholarunion.it/news/${data.slug || data.id}`;
      applySeo({
        title: data.seo_title || data.title,
        description: data.seo_description || data.excerpt,
        image: data.cover_image || undefined,
        type: "article",
        url: pageUrl,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: data.title,
          description: data.seo_description || data.excerpt || undefined,
          image: data.cover_image ? [data.cover_image] : undefined,
          datePublished: data.published_at || data.created_at,
          dateModified: data.updated_at || data.published_at || data.created_at,
          inLanguage: "ar",
          mainEntityOfPage: pageUrl,
          author: { "@type": "Organization", name: data.publisher_source || "اتحاد علماء الأزهر" },
          publisher: {
            "@type": "Organization",
            name: "اتحاد علماء الأزهر",
            logo: { "@type": "ImageObject", url: "https://alazharscholarunion.it/logo.png" },
          },
        },
      });
      if (data.pdf_attachment) {
        setSignedPdf(await resolveStorageUrl(data.pdf_attachment, 3600));
      }
      const { data: rel } = await supabase
        .from("news_posts")
        .select("id,slug,title,cover_image,category,published_at,created_at")
        .eq("status", "published")
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(3);
      setRelated(rel ?? []);
    })();
  }, [slug]);

  if (post === undefined) {
    return <SiteLayout><div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div></SiteLayout>;
  }
  if (post === null) {
    return <SiteLayout><div className="container-narrow py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">الخبر غير موجود</h1>
      <Button asChild><Link to="/news">العودة للأخبار</Link></Button>
    </div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <article className="container-narrow py-12 md:py-16">
        <Button variant="ghost" asChild className="mb-4"><Link to="/news"><ArrowRight className="h-4 w-4" /> كل الأخبار</Link></Button>
        <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{post.category}</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.published_at ?? post.created_at)}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
        <div className="text-sm text-muted-foreground mb-6">نُشر بواسطة: <span className="text-foreground/80 font-medium">{post.publisher_source}</span></div>

        {post.cover_image && (
          <div className="w-full rounded-2xl mb-8 aspect-[16/9] overflow-hidden">
            <SmartImage src={post.cover_image} alt={post.title} variant="news" className="w-full h-full object-cover" />
          </div>
        )}

        {post.excerpt && <p className="text-lg text-muted-foreground leading-loose mb-6">{post.excerpt}</p>}

        {post.content && (
          <RichTextView html={post.content} className="rich-content prose prose-lg max-w-none leading-loose" />
        )}

        {post.pdf_attachment && /^https?:\/\//i.test(post.pdf_attachment) && (
          <a href={signedPdf || post.pdf_attachment} target="_blank" rel="noopener noreferrer" className="card-elegant p-5 mt-8 flex items-center gap-3 hover:bg-muted/30">
            <FileText className="h-8 w-8 text-crimson shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">ملف مرفق (PDF)</div>
              <div className="text-xs text-muted-foreground truncate" dir="ltr">{fileNameFromUrl(post.pdf_attachment)}</div>
            </div>
            <Button size="sm" variant="outline"><Download className="h-4 w-4" /> تحميل الملف</Button>
          </a>
        )}

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t">
            <h2 className="text-xl font-bold mb-6">أخبار ذات صلة</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to={`/news/${r.slug || r.id}`} className="card-elegant p-4 hover:bg-muted/20 block">
                  <div className="text-xs text-primary mb-2">{r.category}</div>
                  <h3 className="font-bold line-clamp-2 mb-2">{r.title}</h3>
                  <div className="text-xs text-muted-foreground">{formatDate(r.published_at ?? r.created_at)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="container-narrow">
          <ReaderFeedback entityType="news" entityId={post.id} pagePath={`/news/${post.slug || post.id}`} />
        </div>
      </article>
    </SiteLayout>
  );
}
