import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { ui } from "@/i18n/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GraduationCap, Megaphone, HeartHandshake, Tv, Users, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

const areas = [
  { icon: GraduationCap, label: "علمي" },
  { icon: Users, label: "تدريبي" },
  { icon: HeartHandshake, label: "اجتماعي" },
  { icon: Tv, label: "إعلامي" },
  { icon: Megaphone, label: "دعوي" },
];

export default function Partnerships() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({ org: "", contact: "", email: "", country: "", message: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "الشراكات — اتحاد علماء الأزهر";
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.org || !form.email || !form.message) {
      toast.error("يرجى استكمال الحقول المطلوبة");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("بريد إلكتروني غير صحيح");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.contact || form.org,
      email: form.email,
      subject: `طلب شراكة من ${form.org}${form.country ? ` (${form.country})` : ""}`,
      contact_type: "تعاون وشراكات",
      message: form.message,
    });
    setBusy(false);
    if (error) {
      toast.error("تعذر إرسال الطلب. حاول لاحقًا.");
      return;
    }
    toast.success("تم استلام طلبكم. سنتواصل معكم قريبًا.");
    setForm({ org: "", contact: "", email: "", country: "", message: "" });
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="الشراكات"
        title="التعاون والشراكات المؤسسية"
        description="يتعاون الاتحاد مع المؤسسات الإسلامية والعلمية بما يخدم القيم الإنسانية والدعوية."
      />

      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <h2 className="heading-section">مجالات التعاون</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {areas.map((a, i) => (
              <div key={i} className="card-elegant p-6 text-center">
                <a.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="font-semibold">{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-gradient-soft">
        <div className="container-narrow grid lg:grid-cols-[1fr,1.4fr] gap-10">
          <div>
            <h2 className="heading-section mb-4">طلب شراكة مؤسسية</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{ui.partnerCta}</p>
            <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 text-primary font-semibold">
              <Mail className="h-4 w-4" /> {settings.contact_email}
            </a>
          </div>

          <form onSubmit={submit} className="card-elegant p-8 space-y-4">
            <div>
              <Label htmlFor="org">اسم المؤسسة *</Label>
              <Input id="org" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} required maxLength={200} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact">الشخص المسؤول</Label>
                <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} maxLength={200} />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input id="email" type="email" dir="ltr" className="text-left" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={320} />
              </div>
            </div>
            <div>
              <Label htmlFor="country">الدولة</Label>
              <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="message">الرسالة *</Label>
              <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={5000} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>{ui.send}</Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
