import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fireFormConfirmation } from "@/lib/form-notify";
import { Loader2, MessageCircle, Users, CheckCircle2, Send, Calendar } from "lucide-react";
import { applySeo } from "@/lib/seo";
import { RichTextView } from "@/components/RichTextView";
import { useDynamicPage } from "@/hooks/useDynamicPages";
import { formatDate } from "@/lib/admin-utils";

const TYPE_LABEL: Record<string, string> = { meeting: "لقاء", conference: "مؤتمر", seminar: "ندوة", initiative: "مبادرة" };
const REQ_KINDS = ["تعاون مؤسسي", "اقتراح مبادرة", "مشاركة في حوار", "استفسار عام"];

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(200),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(320),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  request_kind: z.string().trim().min(1).max(100),
  message: z.string().trim().min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل").max(5000),
});

export default function CivilizationalDialogue() {
  const { page } = useDynamicPage("civilizational-dialogue");
  const [items, setItems] = useState<any[] | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", organization: "", country: "", request_kind: REQ_KINDS[0], message: "" });

  useEffect(() => {
    applySeo({
      title: page?.seo_title || page?.title || "الحوار والتواصل الحضاري",
      description: page?.seo_description || page?.intro || "حوار بين الأديان والثقافات بمنهج وسطي.",
    });
  }, [page]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("dialogue_initiatives").select("*")
        .eq("publish_status", "published")
        .order("display_order", { ascending: true })
        .order("initiative_date", { ascending: false, nullsFirst: false });
      setItems(data ?? []);
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("dialogue_requests").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      organization: parsed.data.organization || null,
      country: parsed.data.country || null,
      request_kind: parsed.data.request_kind,
      message: parsed.data.message,
    }).select("id").maybeSingle();
    setSubmitting(false);
    if (error) return toast.error("تعذّر إرسال الطلب. حاول لاحقًا.");
    fireFormConfirmation("dialogue", inserted?.id);
    setSuccess(true);
    setForm({ full_name: "", email: "", organization: "", country: "", request_kind: REQ_KINDS[0], message: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="الحوار الحضاري"
        title={page?.title || "الحوار والتواصل الحضاري"}
        description={page?.intro || "تعزيز الحوار بين الأديان والثقافات وفق رؤية إسلامية وسطية."}
      />

      <section className="container-narrow py-12 md:py-16">
        {page?.content && (
          <Card className="p-6 md:p-8 mb-10">
            <RichTextView html={page.content} />
          </Card>
        )}

        <h2 className="text-2xl font-bold mb-6">المبادرات واللقاءات</h2>
        {items === null ? (
          <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground mb-10">لا توجد مبادرات منشورة حاليًا.</Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {items.map((it) => (
              <Card key={it.id} className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{TYPE_LABEL[it.initiative_type]}</span>
                  {it.initiative_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(it.initiative_date)}</span>}
                </div>
                <h3 className="font-bold text-lg mb-2 leading-snug">{it.title}</h3>
                {it.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{it.description}</p>}
              </Card>
            ))}
          </div>
        )}

        <Card className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">تم استلام طلبكم</h3>
              <p className="text-muted-foreground">شكرًا لتواصلكم. سنرد عليكم قريبًا.</p>
              <Button className="mt-4" variant="outline" onClick={() => setSuccess(false)}>إرسال طلب آخر</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">اقتراح مبادرة أو طلب تعاون</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>الاسم *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={200} required /></div>
                <div><Label>البريد الإلكتروني *</Label><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={320} required /></div>
                <div><Label>الجهة / المؤسسة</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} maxLength={200} /></div>
                <div><Label>الدولة</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={100} /></div>
              </div>
              <div>
                <Label>نوع الطلب</Label>
                <Select value={form.request_kind} onValueChange={(v) => setForm({ ...form, request_kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REQ_KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>الرسالة *</Label><Textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={5000} required /></div>
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال الطلب
              </Button>
            </form>
          )}
        </Card>
      </section>
    </SiteLayout>
  );
}
