import { useEffect } from "react";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GraduationCap, Megaphone, HeartHandshake, Tv, Users, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useDynamicPage } from "@/hooks/useDynamicPages";
import { supabase } from "@/integrations/supabase/client";
import { applySeo } from "@/lib/seo";

const areas = [
  { icon: GraduationCap, label: "علمي" },
  { icon: Users, label: "تدريبي" },
  { icon: HeartHandshake, label: "اجتماعي" },
  { icon: Tv, label: "إعلامي" },
  { icon: Megaphone, label: "دعوي" },
];

export default function Partnerships() {
  const { settings } = useSiteSettings();
  const { page, loaded } = useDynamicPage("partnerships");
  const [form, setForm] = useState({ org: "", contact: "", email: "", country: "", message: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    applySeo({
      title: page?.seo_title || page?.title || "الشراكات والتعاون",
      description:
        page?.seo_description ||
        page?.intro ||
        "فرص تعاون وشراكة مع اتحاد علماء الأزهر في المجالات العلمية والتدريبية والاجتماعية والإعلامية والدعوية.",
    });
  }, [page]);

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
    if (error) return toast.error("تعذر إرسال الطلب. حاول لاحقًا.");
    toast.success("تم استلام طلبكم. سنتواصل معكم قريبًا.");
    setForm({ org: "", contact: "", email: "", country: "", message: "" });
  };

  if (!loaded) return <SiteLayout><div className="section-padding text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div></SiteLayout>;

  if (page && page.status !== "published") {
    return (
      <SiteLayout>
        <PageHero eyebrow="الشراكات" title={page.title || "الشراكات"} description="" />
        <section className="section-padding"><div className="container-narrow card-elegant p-10 text-center text-muted-foreground">هذه الصفحة غير متاحة حاليًا.</div></section>
      </SiteLayout>
    );
  }

  const title = page?.title || "التعاون والشراكات المؤسسية";
  const description = page?.intro || page?.seo_description || "يتعاون الاتحاد مع المؤسسات الإسلامية والعلمية بما يخدم القيم الإنسانية والدعوية.";
  const content = page?.content?.trim();

  return (
    <SiteLayout>
      <PageHero eyebrow="الشراكات" title={title} description={description} />

      {content && (
        <section className="section-padding">
          <div className="container-narrow">
            <article className="card-elegant p-8 md:p-12">
              {content.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="text-foreground/85 leading-loose mb-4 last:mb-0 whitespace-pre-line">{p}</p>
              ))}
            </article>
          </div>
        </section>
      )}

      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-10"><h2 className="heading-section">مجالات التعاون</h2></div>
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
            <p className="text-muted-foreground leading-relaxed mb-6">نرحب بطلبات التعاون المؤسسي لخدمة المنهج الأزهري والقضايا الإسلامية.</p>
            <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 text-primary font-semibold">
              <Mail className="h-4 w-4" /> {settings.contact_email}
            </a>
          </div>

          <form onSubmit={submit} className="card-elegant p-8 space-y-4">
            <div><Label htmlFor="org">اسم المؤسسة *</Label><Input id="org" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} required maxLength={200} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label htmlFor="contact">الشخص المسؤول</Label><Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} maxLength={200} /></div>
              <div><Label htmlFor="email">البريد الإلكتروني *</Label><Input id="email" type="email" dir="ltr" className="text-left" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={320} /></div>
            </div>
            <div><Label htmlFor="country">الدولة</Label><Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={100} /></div>
            <div><Label htmlFor="message">الرسالة *</Label><Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={5000} /></div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>إرسال</Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
