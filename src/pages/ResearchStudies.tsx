import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { fireFormConfirmation } from "@/lib/form-notify";
import { Loader2, FileText, Download, Eye, Send, CheckCircle2 } from "lucide-react";
import { applySeo } from "@/lib/seo";
import { RichTextView } from "@/components/RichTextView";
import { useDynamicPage } from "@/hooks/useDynamicPages";
import { SmartImage } from "@/components/SmartImage";
import { Skeleton } from "@/components/ui/skeleton";


const CAT_LABEL: Record<string, string> = {
  sharia: "بحوث شرعية",
  intellectual: "دراسات فكرية",
  contemporary: "قضايا معاصرة",
  reports: "تقارير علمية",
};

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(200),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(320),
  title: z.string().trim().min(3, "العنوان مطلوب").max(300),
  category: z.enum(["sharia", "intellectual", "contemporary", "reports"]),
  abstract: z.string().trim().min(10, "الملخص يجب أن يكون 10 أحرف على الأقل").max(8000),
});

export default function ResearchStudies() {
  const { page } = useDynamicPage("research-studies");
  const [items, setItems] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<"all" | keyof typeof CAT_LABEL>("all");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", title: "", category: "sharia" as keyof typeof CAT_LABEL, abstract: "" });

  useEffect(() => {
    applySeo({
      title: page?.seo_title || page?.title || "البحوث والدراسات",
      description: page?.seo_description || page?.intro || "بحوث ودراسات شرعية وفكرية بمنهج أزهري رصين.",
    });
  }, [page]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("research_items").select("*")
        .eq("publish_status", "published")
        .order("display_order", { ascending: true })
        .order("published_at", { ascending: false, nullsFirst: false });
      setItems(data ?? []);
    })();
  }, []);

  const filtered = (items ?? []).filter((r) => filter === "all" || r.category === filter);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    try {
      let attachment_url: string | null = null;
      if (file) {
        if (file.size > 15 * 1024 * 1024) throw new Error("حجم الملف يجب ألا يتجاوز 15 ميغابايت");
        if (file.type !== "application/pdf") throw new Error("يجب أن يكون الملف من نوع PDF");
        const path = `${crypto.randomUUID()}/${Date.now()}.pdf`;
        const up = await supabase.storage.from("research-submissions").upload(path, file, { contentType: "application/pdf", upsert: false });
        if (up.error) throw up.error;
        attachment_url = up.data.path;
      }
      const { data: inserted, error } = await supabase.from("research_submissions").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        title: parsed.data.title,
        category: parsed.data.category,
        abstract: parsed.data.abstract,
        attachment_url,
      }).select("id").maybeSingle();
      if (error) throw error;
      fireFormConfirmation("research", inserted?.id);
      setSuccess(true);
      setForm({ full_name: "", email: "", title: "", category: "sharia", abstract: "" });
      setFile(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      toast.error("تعذّر إرسال البحث. يرجى المحاولة لاحقًا.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="البحث العلمي"
        title={page?.title || "البحوث والدراسات"}
        description={page?.intro || "بحوث ودراسات شرعية وفكرية متخصصة بمنهج أزهري رصين."}
      />

      <section className="container-narrow py-12 md:py-16">
        {page?.content && (
          <Card className="p-6 md:p-8 mb-10">
            <RichTextView html={page.content} />
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-bold">البحوث المنشورة</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>الكل</Button>
            {(Object.keys(CAT_LABEL) as Array<keyof typeof CAT_LABEL>).map((c) => (
              <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>{CAT_LABEL[c]}</Button>
            ))}
          </div>
        </div>

        {items === null ? (
          <div className="grid md:grid-cols-2 gap-4 mb-12 min-h-[300px]">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground mb-10">لا توجد بحوث في هذا التصنيف حاليًا.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {filtered.map((r) => (
              <Card key={r.id} className="overflow-hidden flex flex-col group">
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <SmartImage
                    src={r.cover_image}
                    alt={r.title}
                    variant="general"
                    icon={FileText}
                    fallbackClassName="bg-gradient-to-br from-primary/15 to-primary-glow/10"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{CAT_LABEL[r.category]}</span>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 leading-snug">{r.title}</h3>
                  {r.author && <div className="text-xs text-muted-foreground mb-2">المصدر: <span className="text-foreground/80 font-medium">{r.author}</span></div>}
                  {r.abstract && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-3 flex-1">{r.abstract}</p>}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {r.file_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /> عرض</a>
                      </Button>
                    )}
                    {r.file_url && (
                      <Button asChild size="sm">
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" download><Download className="h-4 w-4" /> تحميل</a>
                      </Button>
                    )}
                    {!r.file_url && r.external_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={r.external_url} target="_blank" rel="noopener noreferrer">رابط خارجي</a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}


        <Card className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">تم استلام بحثكم</h3>
              <p className="text-muted-foreground">سيُراجع بحثكم من قِبل اللجنة العلمية وسنوافيكم بالنتيجة.</p>
              <Button className="mt-4" variant="outline" onClick={() => setSuccess(false)}>إرسال بحث آخر</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-xl font-bold">إرسال بحث للنشر</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={200} required /></div>
                <div><Label>البريد الإلكتروني *</Label><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={320} required /></div>
              </div>
              <div><Label>عنوان البحث *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={300} required /></div>
              <div>
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(CAT_LABEL) as Array<keyof typeof CAT_LABEL>).map((c) => <SelectItem key={c} value={c}>{CAT_LABEL[c]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>ملخص البحث *</Label><Textarea rows={6} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} maxLength={8000} required /></div>
              <div>
                <Label>ملف البحث (PDF — حد أقصى 15MB)</Label>
                <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <p className="text-xs text-muted-foreground mt-1">الملف خاص ولن يكون متاحًا للعموم — سيراجعه فريق الاتحاد فقط.</p>
              </div>
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال البحث
              </Button>
            </form>
          )}
        </Card>
        <ReaderFeedback entityType="research" pagePath="/research-studies" />
      </section>
    </SiteLayout>
  );
}
