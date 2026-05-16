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
import { Loader2, GraduationCap, BookOpen, Award, CheckCircle2, Send } from "lucide-react";
import { applySeo } from "@/lib/seo";
import { RichTextView } from "@/components/RichTextView";
import { useDynamicPage } from "@/hooks/useDynamicPages";

const CATEGORY_LABEL: Record<string, string> = { course: "دورة", diploma: "دبلوم", ijaza: "إجازة علمية" };
const LEVEL_LABEL: Record<string, string> = { beginner: "تمهيدي", intermediate: "متوسط", advanced: "متقدّم" };
const STATUS_LABEL: Record<string, string> = { available: "متاح", soon: "قريبًا", closed: "مغلق" };
const STATUS_BADGE: Record<string, string> = {
  available: "bg-primary/10 text-primary",
  soon: "bg-amber-500/10 text-amber-700",
  closed: "bg-muted text-muted-foreground",
};

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(200),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  qualification: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export default function ShariaAcademy() {
  const { page } = useDynamicPage("sharia-academy");
  const [programs, setPrograms] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<"all" | "course" | "diploma" | "ijaza">("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", country: "", qualification: "", notes: "" });

  useEffect(() => {
    applySeo({
      title: page?.seo_title || page?.title || "أكاديمية العلوم الشرعية",
      description: page?.seo_description || page?.intro || "برامج تعليمية متخصصة في العلوم الشرعية.",
    });
  }, [page]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("academy_programs")
        .select("*")
        .eq("publish_status", "published")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      setPrograms(data ?? []);
    })();
  }, []);

  const filtered = (programs ?? []).filter((p) => filter === "all" || p.category === filter);

  const apply = (programId: string, programTitle: string) => {
    setSelectedProgram(programId);
    setForm({ ...form, notes: form.notes || `التسجيل في: ${programTitle}` });
    setTimeout(() => document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const programObj = (programs ?? []).find((p) => p.id === selectedProgram) || null;
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("academy_applications").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      country: parsed.data.country || null,
      program_id: selectedProgram || null,
      program_title: programObj?.title || null,
      qualification: parsed.data.qualification || null,
      notes: parsed.data.notes || null,
    }).select("id").maybeSingle();
    setSubmitting(false);
    if (error) return toast.error("تعذّر إرسال الطلب. حاول لاحقًا.");
    fireFormConfirmation("academy", inserted?.id);
    setSuccess(true);
    setForm({ full_name: "", email: "", phone: "", country: "", qualification: "", notes: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="التعليم الشرعي"
        title={page?.title || "أكاديمية العلوم الشرعية"}
        description={page?.intro || "برامج تعليمية متخصصة في العلوم الشرعية: دورات ودبلومات وإجازات علمية."}
      />

      <section className="container-narrow py-12 md:py-16">
        {page?.content && (
          <Card className="p-6 md:p-8 mb-10">
            <RichTextView html={page.content} />
          </Card>
        )}

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: BookOpen, label: "دورات علمية" },
            { icon: GraduationCap, label: "دبلومات تأهيلية" },
            { icon: Award, label: "إجازات علمية" },
          ].map((c) => (
            <Card key={c.label} className="p-4 text-center">
              <c.icon className="h-7 w-7 text-primary mx-auto mb-2" />
              <div className="font-bold text-sm">{c.label}</div>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-bold">البرامج المتاحة</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "course", "diploma", "ijaza"] as const).map((c) => (
              <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>
                {c === "all" ? "الكل" : CATEGORY_LABEL[c]}
              </Button>
            ))}
          </div>
        </div>

        {programs === null ? (
          <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">لا توجد برامج متاحة في هذا التصنيف حاليًا.</Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {filtered.map((p) => (
              <Card key={p.id} className="p-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{CATEGORY_LABEL[p.category]}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 leading-snug">{p.title}</h3>
                {p.description && <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3 flex-1">{p.description}</p>}
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  {p.duration && <div>المدة: <span className="text-foreground/80 font-medium">{p.duration}</span></div>}
                  <div>المستوى: <span className="text-foreground/80 font-medium">{LEVEL_LABEL[p.level]}</span></div>
                </div>
                <Button
                  className="mt-auto"
                  disabled={p.status === "closed"}
                  onClick={() => apply(p.id, p.title)}
                >
                  {p.status === "closed" ? "التسجيل مغلق" : p.status === "soon" ? "اطلب إشعارًا" : "التسجيل في البرنامج"}
                </Button>
              </Card>
            ))}
          </div>
        )}

        <Card id="apply-form" className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">تم استلام طلبكم</h3>
              <p className="text-muted-foreground">سيتم مراجعته من قبل القسم المختص والتواصل معكم قريبًا.</p>
              <Button className="mt-4" variant="outline" onClick={() => setSuccess(false)}>إرسال طلب آخر</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-xl font-bold">طلب التسجيل في برنامج</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={200} required /></div>
                <div><Label>البريد الإلكتروني *</Label><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={320} required /></div>
                <div><Label>رقم الهاتف</Label><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={50} /></div>
                <div><Label>الدولة</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={100} /></div>
              </div>
              <div>
                <Label>البرنامج المطلوب</Label>
                <Select value={selectedProgram || "none"} onValueChange={(v) => setSelectedProgram(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="اختر برنامجًا" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— استفسار عام —</SelectItem>
                    {(programs ?? []).filter((p) => p.status !== "closed").map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>المؤهل العلمي</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} maxLength={500} /></div>
              <div><Label>ملاحظات</Label><Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={4000} /></div>
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال الطلب
              </Button>
            </form>
          )}
        </Card>
        <ReaderFeedback entityType="academy" pagePath="/sharia-academy" />
      </section>
    </SiteLayout>
  );
}
