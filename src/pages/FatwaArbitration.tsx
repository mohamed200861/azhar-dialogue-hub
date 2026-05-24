import { useEffect, useState } from "react";
import { z } from "zod";
import { applySeo } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { fireFormConfirmation } from "@/lib/form-notify";
import { FatwaPublicFilesList } from "@/components/FatwaPublicFilesList";
import { FatwaDepartmentsGrid } from "@/components/FatwaDepartmentsGrid";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { Loader2, Send, CheckCircle2, Scale, Gavel, ShieldCheck } from "lucide-react";

const REQUEST_TYPES = [
  { value: "fatwa", label: "طلب فتوى" },
  { value: "arbitration", label: "طلب تحكيم شرعي" },
  { value: "family_consult", label: "استشارة أسرية" },
  { value: "financial_consult", label: "استشارة مالية" },
  { value: "other", label: "أخرى" },
] as const;

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(200),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  request_type: z.enum(["fatwa", "arbitration", "family_consult", "financial_consult", "other"]),
  subject: z.string().trim().min(3, "الموضوع مطلوب").max(300),
  message: z.string().trim().min(10, "الرجاء كتابة الطلب بالتفصيل").max(8000),
  is_urgent: z.boolean(),
  consent: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة قبل الإرسال" }) }),
});

export default function FatwaArbitration() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  useEffect(() => {
    applySeo({
      title: "الفتوى والتحكيم الشرعي",
      description: "قسم يقدّم الفتاوى والتحكيم في النزاعات الأسرية والمالية وفق الشريعة الإسلامية بمنهج وسطي.",
    });
  }, []);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    request_type: "fatwa" as (typeof REQUEST_TYPES)[number]["value"],
    subject: "",
    message: "",
    is_urgent: false,
    consent: false,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "يرجى التحقق من الحقول");
      return;
    }
    setSubmitting(true);
    try {
      let attachment_url: string | null = null;
      if (file) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error("حجم المرفق يجب ألا يتجاوز 8 ميغابايت");
          setSubmitting(false);
          return;
        }
        const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!allowed.includes(file.type)) {
          toast.error("نوع الملف غير مسموح. PDF أو صورة فقط.");
          setSubmitting(false);
          return;
        }
        const ext = file.name.split(".").pop() || "bin";
        const path = `${crypto.randomUUID()}/${Date.now()}.${ext}`;
        const up = await supabase.storage.from("fatwa-attachments").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (up.error) throw up.error;
        attachment_url = up.data.path;
      }

      const { data: inserted, error } = await supabase.from("fatwa_arbitration_requests").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        country: form.country.trim() || null,
        request_type: form.request_type,
        subject: form.subject.trim(),
        message: form.message.trim(),
        is_urgent: form.is_urgent,
        attachment_url,
        department_id: departmentId,
      } as any).select("id").maybeSingle();
      if (error) throw error;
      fireFormConfirmation("fatwa", inserted?.id);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      toast.error("تعذّر إرسال الطلب. يرجى المحاولة لاحقًا.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="منهج وسطي للإصلاح وتحقيق العدالة"
        title="الفتوى والتحكيم الشرعي"
        description="قسم يقدّم الفتاوى والتحكيم في النزاعات الأسرية والمالية وفق الشريعة الإسلامية بمنهج وسطي، سعيًا للإصلاح وتحقيق العدالة."
      >
        <a href="#fatwa-form">
          <Button size="lg" className="bg-background text-primary hover:bg-background/90">
            <Send className="h-4 w-4" />
            إرسال طلب
          </Button>
        </a>
      </PageHero>

      <section className="container-narrow py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Scale, title: "تأصيل علمي", desc: "منهج أزهري وسطي يجمع بين التأصيل ومراعاة الواقع." },
            { icon: Gavel, title: "تحكيم شرعي", desc: "حلّ النزاعات الأسرية والمالية وفق الشريعة." },
            { icon: ShieldCheck, title: "سرية تامة", desc: "تُعالج طلباتكم بسرية واحترام كامل للخصوصية." },
          ].map((c) => (
            <Card key={c.title} className="p-5 text-center">
              <c.icon className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="font-bold mb-1">{c.title}</div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </Card>
          ))}
        </div>

        <FatwaDepartmentsGrid
          selectedId={departmentId}
          onSelect={(d) => {
            setDepartmentId(d.id === departmentId ? null : d.id);
            document.getElementById("fatwa-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />


        <div className="prose prose-sm max-w-none text-foreground/90 leading-loose mb-10">
          <p>
            يُعنى قسم الفتوى والتحكيم الشرعي في اتحاد علماء الأزهر بتقديم الفتاوى الشرعية للسائلين، والنظر في النزاعات الأسرية والمالية وحلّها وفق أحكام الشريعة الإسلامية.
          </p>
          <p>
            نعتمد منهجًا أزهريًا وسطيًا يجمع بين التأصيل العلمي ومراعاة الواقع، ويهدف إلى الإصلاح بين الناس، وحفظ الحقوق، وتحقيق العدالة.
          </p>
          <p>للتواصل مع القسم، يُرجى استخدام النموذج التالي مع توضيح طبيعة الطلب: استفتاء أو طلب تحكيم.</p>
        </div>

        <Card id="fatwa-form" className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">تم استلام طلبكم بنجاح</h3>
              <p className="text-muted-foreground">
                سيتم مراجعته من قبل القسم المختص والتواصل معكم عند الحاجة.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => { setSuccess(false); setFile(null); setForm({ full_name: "", email: "", phone: "", country: "", request_type: "fatwa", subject: "", message: "", is_urgent: false, consent: false }); }}>
                إرسال طلب آخر
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <h2 className="text-xl font-bold">نموذج الطلب</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>الاسم الكامل *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={200} required />
                </div>
                <div>
                  <Label>البريد الإلكتروني *</Label>
                  <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={320} required />
                </div>
                <div>
                  <Label>رقم الهاتف (اختياري)</Label>
                  <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={50} />
                </div>
                <div>
                  <Label>الدولة</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={100} />
                </div>
              </div>

              <div>
                <Label>نوع الطلب *</Label>
                <Select value={form.request_type} onValueChange={(v: any) => setForm({ ...form, request_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>موضوع الطلب *</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={300} required />
              </div>

              <div>
                <Label>وصف الطلب بالتفصيل *</Label>
                <Textarea rows={7} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={8000} required />
              </div>

              <div>
                <Label className="mb-2 block">هل الطلب عاجل؟</Label>
                <RadioGroup
                  value={form.is_urgent ? "yes" : "no"}
                  onValueChange={(v) => setForm({ ...form, is_urgent: v === "yes" })}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="urg-no" />
                    <Label htmlFor="urg-no" className="cursor-pointer">لا</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="urg-yes" />
                    <Label htmlFor="urg-yes" className="cursor-pointer">نعم</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>مرفق (اختياري — PDF أو صورة، حد أقصى 8MB)</Label>
                <Input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="flex items-start gap-2 p-4 rounded-md bg-muted/40">
                <Checkbox
                  id="consent"
                  checked={form.consent}
                  onCheckedChange={(v) => setForm({ ...form, consent: !!v })}
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  أقر بأن المعلومات المرسلة صحيحة، وأوافق على معالجة طلبي بسرية.
                </Label>
              </div>

              <Button type="submit" disabled={submitting} size="lg" className="w-full md:w-auto">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال الطلب
              </Button>
            </form>
          )}
        </Card>

      </section>

      <FatwaPublicFilesList />

      <section className="section-padding pt-0">
        <div className="container-narrow">
          <ReaderFeedback entityType="fatwa" pagePath="/fatwa-arbitration" />
        </div>
      </section>
    </SiteLayout>
  );
}
