import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { applySeo } from "@/lib/seo";
import { toast } from "sonner";
import {
  IdCard, Send, Loader2, CheckCircle2, Award, Users, Building2, Globe2,
  Star, BadgeCheck, Crown,
} from "lucide-react";

type MembershipType = {
  id: string; slug: string; title_ar: string; title_en: string | null;
  description_ar: string | null; price: number; currency: string;
  requirements: any; benefits: any; sort_order: number;
};
type PayMethod = {
  id: string; provider_key: string; title: string; description: string | null; instructions: string | null;
};

const ICONS: Record<string, any> = {
  individual: IdCard, scientific: Award, institutional: Building2,
  international: Globe2, honorary: Crown, corporate: Users,
};

const schema = z.object({
  full_name_ar: z.string().trim().min(2, "الاسم بالعربية مطلوب").max(200),
  full_name_en: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  mobile: z.string().trim().max(50).optional().or(z.literal("")),
  residence_country: z.string().trim().max(100).optional().or(z.literal("")),
  citizenship: z.string().trim().max(100).optional().or(z.literal("")),
  academic_specialization: z.string().trim().max(500).optional().or(z.literal("")),
  job_title: z.string().trim().max(200).optional().or(z.literal("")),
  scientific_contributions: z.string().trim().max(8000).optional().or(z.literal("")),
  social_links: z.string().trim().max(1000).optional().or(z.literal("")),
  recommendation_1_name: z.string().trim().max(200).optional().or(z.literal("")),
  recommendation_1_membership_no: z.string().trim().max(60).optional().or(z.literal("")),
  recommendation_1_note: z.string().trim().max(1000).optional().or(z.literal("")),
  recommendation_2_name: z.string().trim().max(200).optional().or(z.literal("")),
  recommendation_2_membership_no: z.string().trim().max(60).optional().or(z.literal("")),
  recommendation_2_note: z.string().trim().max(1000).optional().or(z.literal("")),
  membership_type_id: z.string().uuid().optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على الشروط" }) }),
});

async function uploadPrivate(file: File): Promise<string | null> {
  if (file.size > 10 * 1024 * 1024) { toast.error("الحد الأقصى 10 ميغابايت"); return null; }
  const ok = ["application/pdf","application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg","image/png","image/jpg"].includes(file.type);
  if (!ok) { toast.error("نوع الملف غير مدعوم"); return null; }
  const folder = crypto.randomUUID();
  const safe = file.name.replace(/[^\p{L}\p{N}._-]+/gu, "_");
  const path = `${folder}/${safe}`;
  const up = await supabase.storage.from("membership-attachments").upload(path, file, {
    contentType: file.type, upsert: false,
  });
  if (up.error) { toast.error(up.error.message); return null; }
  return up.data.path;
}

export default function Memberships() {
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [methods, setMethods] = useState<PayMethod[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [hp, setHp] = useState(""); // honeypot

  const [form, setForm] = useState({
    full_name_ar: "", full_name_en: "", email: "", phone: "", mobile: "",
    residence_country: "", citizenship: "", academic_specialization: "",
    job_title: "", scientific_contributions: "", social_links: "",
    recommendation_1_name: "", recommendation_1_membership_no: "", recommendation_1_note: "",
    recommendation_2_name: "", recommendation_2_membership_no: "", recommendation_2_note: "",
    membership_type_id: "",
    consent: false,
  });

  useEffect(() => {
    applySeo({ title: "العضوية — اتحاد علماء الأزهر", description: "تقدّم بطلب الانضمام لعضوية اتحاد علماء الأزهر." });
    document.title = "العضوية — اتحاد علماء الأزهر";
    (async () => {
      const [t, m] = await Promise.all([
        supabase.from("membership_types").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("membership_payment_methods").select("*").eq("is_enabled", true).order("sort_order"),
      ]);
      setTypes((t.data ?? []) as any);
      setMethods((m.data ?? []) as any);
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // bot
    const parsed = schema.safeParse({ ...form, membership_type_id: selectedType });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "تحقق من الحقول"); return; }
    setSubmitting(true);
    try {
      let cv_url: string | null = null;
      let personal_photo_url: string | null = null;
      if (cv) cv_url = await uploadPrivate(cv);
      if (photo) personal_photo_url = await uploadPrivate(photo);

      const payload: any = {
        ...form,
        full_name_en: form.full_name_en || null,
        phone: form.phone || null,
        mobile: form.mobile || null,
        residence_country: form.residence_country || null,
        citizenship: form.citizenship || null,
        academic_specialization: form.academic_specialization || null,
        job_title: form.job_title || null,
        scientific_contributions: form.scientific_contributions || null,
        social_links: form.social_links || null,
        recommendation_1_name: form.recommendation_1_name || null,
        recommendation_1_membership_no: form.recommendation_1_membership_no || null,
        recommendation_1_note: form.recommendation_1_note || null,
        recommendation_2_name: form.recommendation_2_name || null,
        recommendation_2_membership_no: form.recommendation_2_membership_no || null,
        recommendation_2_note: form.recommendation_2_note || null,
        membership_type_id: selectedType || null,
        cv_url, personal_photo_url,
      };
      delete payload.consent;

      const { error } = await supabase.from("membership_applications").insert(payload);
      if (error) throw error;
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      toast.error("تعذّر إرسال الطلب. حاول لاحقًا.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="انضم إلى اتحاد علماء الأزهر"
        title="العضوية"
        description="عضوية مفتوحة لطلاب العلم والعلماء والمؤسسات الراغبين في الإسهام في رسالة الاتحاد العلمية والدعوية."
      >
        <a href="#apply">
          <Button size="lg" className="bg-background text-primary hover:bg-background/90">
            <Send className="h-4 w-4" /> قدم طلبك الآن
          </Button>
        </a>
      </PageHero>

      <section className="container-wide py-12">
        <div className="text-center mb-8">
          <span className="eyebrow">أنواع العضوية</span>
          <h2 className="heading-section mt-3">اختر نوع العضوية المناسبة</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {types.map((t) => {
            const Icon = ICONS[t.slug] || BadgeCheck;
            const active = selectedType === t.id;
            return (
              <Card
                key={t.id}
                onClick={() => { setSelectedType(t.id); document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className={`p-6 cursor-pointer transition-all border-2 hover:shadow-elegant ${active ? "border-primary bg-primary/5" : "border-transparent"}`}
              >
                <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-emerald text-primary-foreground mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1">{t.title_ar}</h3>
                {t.title_en && <p className="text-xs text-muted-foreground mb-2">{t.title_en}</p>}
                {t.description_ar && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{t.description_ar}</p>}
                {t.price > 0 && (
                  <div className="text-sm font-bold text-primary">{t.price} {t.currency}</div>
                )}
                {Array.isArray(t.benefits) && t.benefits.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {t.benefits.slice(0, 4).map((b: any, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{String(b)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container-narrow pb-12" id="apply">
        <Card className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">تم استلام طلب العضوية بنجاح</h3>
              <p className="text-muted-foreground">سيتم مراجعته من اللجنة المختصة والتواصل معكم.</p>
              <Button asChild className="mt-6" variant="outline"><Link to="/">العودة للرئيسية</Link></Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <h2 className="text-xl font-bold">نموذج طلب العضوية</h2>

              {/* honeypot */}
              <input
                type="text" tabIndex={-1} autoComplete="off" value={hp}
                onChange={(e) => setHp(e.target.value)}
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
                aria-hidden
              />

              <div>
                <Label>نوع العضوية *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue placeholder="اختر نوع العضوية" /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.title_ar}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <h3 className="font-bold text-sm pt-2 border-t">البيانات الشخصية</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>الاسم الكامل بالعربية *</Label>
                  <Input value={form.full_name_ar} onChange={(e) => setForm({ ...form, full_name_ar: e.target.value })} maxLength={200} required />
                </div>
                <div>
                  <Label>الاسم بالإنجليزية</Label>
                  <Input dir="ltr" value={form.full_name_en} onChange={(e) => setForm({ ...form, full_name_en: e.target.value })} maxLength={200} />
                </div>
                <div>
                  <Label>بلد الإقامة</Label>
                  <Input value={form.residence_country} onChange={(e) => setForm({ ...form, residence_country: e.target.value })} maxLength={100} />
                </div>
                <div>
                  <Label>الجنسية</Label>
                  <Input value={form.citizenship} onChange={(e) => setForm({ ...form, citizenship: e.target.value })} maxLength={100} />
                </div>
                <div>
                  <Label>التخصص العلمي</Label>
                  <Input value={form.academic_specialization} onChange={(e) => setForm({ ...form, academic_specialization: e.target.value })} maxLength={500} />
                </div>
                <div>
                  <Label>الوظيفة الحالية</Label>
                  <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} maxLength={200} />
                </div>
              </div>

              <div>
                <Label>الإسهامات العلمية</Label>
                <Textarea rows={4} value={form.scientific_contributions} onChange={(e) => setForm({ ...form, scientific_contributions: e.target.value })} maxLength={8000} />
              </div>

              <h3 className="font-bold text-sm pt-2 border-t">بيانات التواصل</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>الهاتف</Label>
                  <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={50} />
                </div>
                <div>
                  <Label>الجوال</Label>
                  <Input dir="ltr" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={50} />
                </div>
                <div className="md:col-span-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={320} required />
                </div>
                <div className="md:col-span-2">
                  <Label>روابط التواصل الاجتماعي (Facebook / Twitter)</Label>
                  <Input dir="ltr" value={form.social_links} onChange={(e) => setForm({ ...form, social_links: e.target.value })} maxLength={1000} />
                </div>
              </div>

              <h3 className="font-bold text-sm pt-2 border-t">المرفقات</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>السيرة الذاتية (PDF / DOC — حتى 20MB)</Label>
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
                </div>
                <div>
                  <Label>الصورة الشخصية (JPG / PNG)</Label>
                  <Input type="file" accept="image/jpeg,image/png" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                </div>
              </div>

              <h3 className="font-bold text-sm pt-2 border-t">التوصيات (اختياري)</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <div><Label>المزكي الأول — الاسم</Label><Input value={form.recommendation_1_name} onChange={(e) => setForm({ ...form, recommendation_1_name: e.target.value })} maxLength={200} /></div>
                <div><Label>رقم العضوية</Label><Input value={form.recommendation_1_membership_no} onChange={(e) => setForm({ ...form, recommendation_1_membership_no: e.target.value })} maxLength={60} /></div>
                <div><Label>ملاحظة</Label><Input value={form.recommendation_1_note} onChange={(e) => setForm({ ...form, recommendation_1_note: e.target.value })} maxLength={1000} /></div>
                <div><Label>المزكي الثاني — الاسم</Label><Input value={form.recommendation_2_name} onChange={(e) => setForm({ ...form, recommendation_2_name: e.target.value })} maxLength={200} /></div>
                <div><Label>رقم العضوية</Label><Input value={form.recommendation_2_membership_no} onChange={(e) => setForm({ ...form, recommendation_2_membership_no: e.target.value })} maxLength={60} /></div>
                <div><Label>ملاحظة</Label><Input value={form.recommendation_2_note} onChange={(e) => setForm({ ...form, recommendation_2_note: e.target.value })} maxLength={1000} /></div>
              </div>

              {methods.length > 0 && (
                <div className="rounded-lg bg-muted/40 p-4">
                  <h4 className="font-bold mb-2 text-sm">رسوم العضوية وطرق الدفع</h4>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    {methods.map((m) => (
                      <li key={m.id}><strong className="text-foreground">{m.title}:</strong> {m.instructions || m.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-start gap-2 p-4 rounded-md bg-muted/40">
                <Checkbox id="consent" checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: !!v })} />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  أقر بأن جميع البيانات صحيحة وأوافق على معالجة طلبي وفق سياسة الاتحاد.
                </Label>
              </div>

              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال طلب العضوية
              </Button>
            </form>
          )}
        </Card>
      </section>

      <section className="section-padding pt-0">
        <div className="container-narrow">
          <ReaderFeedback entityType="page" pagePath="/memberships" />
        </div>
      </section>
    </SiteLayout>
  );
}
