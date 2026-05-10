import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Facebook, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { fireFormConfirmation } from "@/lib/form-notify";

const REASONS = [
  "استفسار عام",
  "تعاون وشراكات",
  "طلب إعلامي",
  "فعاليات",
  "مكتبة وإصدارات",
  "أخرى",
];

const schema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(200),
  email: z.string().trim().email("بريد إلكتروني غير صحيح").max(320),
  subject: z.string().trim().max(300).optional().or(z.literal("")),
  contact_type: z.string().trim().max(100),
  message: z.string().trim().min(1, "الرسالة مطلوبة").max(5000),
});

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", contact_type: REASONS[0], message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      contact_type: parsed.data.contact_type,
      message: parsed.data.message,
    }).select("id").maybeSingle();
    setSubmitting(false);
    if (error) {
      toast.error("تعذر إرسال الرسالة. يرجى المحاولة لاحقًا.");
      return;
    }
    fireFormConfirmation("contact", inserted?.id);
    toast.success("تم إرسال رسالتك بنجاح. سنقوم بالرد عليك في أقرب وقت ممكن.");
    setForm({ name: "", email: "", subject: "", contact_type: REASONS[0], message: "" });
  };

  return (
    <SiteLayout>
      <PageHero eyebrow="تواصل" title="تواصل معنا"
        description="يسعدنا تواصلكم لأي استفسار أو اقتراح أو طلب تعاون." />

      <section className="section-padding">
        <div className="container-narrow grid lg:grid-cols-[1fr,1.5fr] gap-10">
          <div className="space-y-4">
            <a href={`mailto:${settings.contact_email}`} className="card-elegant p-6 flex items-start gap-4 hover:bg-muted/30 transition-colors">
              <Mail className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">البريد الإلكتروني</div>
                <div className="font-semibold mt-1 break-all">{settings.contact_email}</div>
              </div>
            </a>
            <div className="card-elegant p-6 flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">مجال العمل</div>
                <div className="font-semibold mt-1">خدمة علمية ودعوية عالمية</div>
              </div>
            </div>
            {settings.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="card-elegant p-6 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                <Facebook className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">فيسبوك</div>
                  <div className="font-semibold mt-1">صفحة الاتحاد الرسمية</div>
                </div>
              </a>
            )}
          </div>

          <form onSubmit={submit} className="card-elegant p-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input id="email" type="email" dir="ltr" className="text-left" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={320} />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">الموضوع</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={300} />
            </div>
            <div>
              <Label htmlFor="reason">نوع التواصل</Label>
              <select id="reason" value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="message">الرسالة *</Label>
              <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={5000} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              إرسال
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
