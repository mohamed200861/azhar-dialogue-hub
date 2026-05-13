import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Download, ExternalLink, Eye, Calendar, Star } from "lucide-react";
import { formatDate, isPdfUrl, resolveStorageUrl } from "@/lib/admin-utils";
import { toast } from "sonner";
import { SmartImage } from "@/components/SmartImage";
import { PdfViewer } from "@/components/PdfViewer";
import { applySeo } from "@/lib/seo";
import { RichTextView } from "@/components/RichTextView";

export default function LibraryDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState<any | null | undefined>(undefined);
  const [related, setRelated] = useState<any[]>([]);
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
      const query = supabase.from("library_items").select("*").eq("status", "published");
      const { data } = isUuid
        ? await query.eq("id", slug).maybeSingle()
        : await query.eq("slug", slug).maybeSingle();
      if (!data) { setItem(null); return; }
      setItem(data);
      const pageUrl = `https://alazharscholarunion.it/library/${data.slug || data.id}`;
      const isBook = /كتب|كتاب|book/i.test(data.category || "");
      applySeo({
        title: data.title,
        description: data.description,
        image: data.cover_image || undefined,
        type: "article",
        url: pageUrl,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": isBook ? "Book" : "CreativeWork",
          name: data.title,
          description: data.description || undefined,
          image: data.cover_image ? [data.cover_image] : undefined,
          inLanguage: data.language || "ar",
          datePublished: data.published_at || data.created_at,
          author: data.author
            ? { "@type": "Person", name: data.author }
            : { "@type": "Organization", name: data.publisher_source || "اتحاد علماء الأزهر" },
          publisher: {
            "@type": "Organization",
            name: data.publisher_source || "اتحاد علماء الأزهر",
            url: "https://alazharscholarunion.it/",
          },
          genre: data.category || undefined,
          url: pageUrl,
        },
      });
      if (data.file_url) {
        const signed = await resolveStorageUrl(data.file_url, 3600);
        setSignedFileUrl(signed);
      }
      const { data: rel } = await supabase
        .from("library_items").select("id,slug,title,cover_image,category,publisher_source,published_at,created_at")
        .eq("status", "published").eq("category", data.category).neq("id", data.id).limit(3);
      setRelated(rel ?? []);
    })();
  }, [slug]);

  const handleDownload = async () => {
    if (!item) return;
    const direct = signedFileUrl || item.file_url || item.external_url;
    if (!direct) { toast.error("لا يوجد ملف متاح حاليًا."); return; }
    await supabase.from("library_items").update({ downloads_count: (item.downloads_count ?? 0) + 1 }).eq("id", item.id);
    setItem({ ...item, downloads_count: (item.downloads_count ?? 0) + 1 });
    window.open(direct, "_blank", "noopener,noreferrer");
  };

  if (item === undefined) return <SiteLayout><div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div></SiteLayout>;
  if (item === null) return <SiteLayout><div className="container-narrow py-20 text-center">
    <h1 className="text-2xl font-bold mb-4">العنصر غير موجود أو لم يعد متاحًا.</h1>
    <Button asChild><Link to="/library">العودة إلى المكتبة</Link></Button>
  </div></SiteLayout>;

  const hasFile = !!(item.file_url || item.external_url);
  const fileHref = signedFileUrl || item.file_url;
  const showPdfPreview = fileHref && isPdfUrl(item.file_url);

  return (
    <SiteLayout>
      <article className="container-wide py-12 md:py-16">
        <Button variant="ghost" asChild className="mb-4"><Link to="/library"><ArrowRight className="h-4 w-4" /> المكتبة الرقمية</Link></Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="card-elegant overflow-hidden">
              <div className="aspect-[3/4] relative">
                <SmartImage src={item.cover_image} alt={item.title} variant="library" className="w-full h-full object-cover" />
                {item.is_featured && <span className="absolute top-3 start-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> مميز</span>}
              </div>
            </div>
            <div className="card-elegant p-5 mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">التصنيف</span><span className="font-medium">{item.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">جهة النشر</span><span className="font-medium">{item.publisher_source}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">اللغة</span><span className="font-medium">{item.language ?? "العربية"}</span></div>
              {item.pages_count ? <div className="flex justify-between"><span className="text-muted-foreground">عدد الصفحات</span><span className="font-medium">{item.pages_count}</span></div> : null}
              <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الإضافة</span><span className="font-medium">{formatDate(item.published_at ?? item.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">عدد التحميلات</span><span className="font-medium">{item.downloads_count ?? 0}</span></div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{item.title}</h1>
            {item.description && <RichTextView html={item.description} className="rich-content text-muted-foreground leading-loose mb-6" />}

            <div className="flex flex-wrap gap-2 mb-8">
              {hasFile ? (
                <>
                  {fileHref && (
                    <Button asChild variant="outline">
                      <a href={fileHref} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /> عرض</a>
                    </Button>
                  )}
                  <Button onClick={handleDownload}><Download className="h-4 w-4" /> تحميل</Button>
                  {item.external_url && (
                    <Button asChild variant="outline">
                      <a href={item.external_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> رابط خارجي</a>
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">لا يوجد ملف متاح حاليًا.</div>
              )}
            </div>

            {showPdfPreview && <PdfViewer url={fileHref!} title={item.title} />}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t">
            <h2 className="text-xl font-bold mb-6">عناصر ذات صلة</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to={`/library/${r.slug || r.id}`} className="card-elegant p-4 hover:bg-muted/20 block">
                  <div className="text-xs text-primary mb-2">{r.category}</div>
                  <h3 className="font-bold line-clamp-2 mb-2">{r.title}</h3>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(r.published_at ?? r.created_at)}
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
