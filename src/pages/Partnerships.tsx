import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { ui, site } from "@/i18n/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GraduationCap, Megaphone, HeartHandshake, Tv, Users, Mail } from "lucide-react";
import { toast } from "sonner";

const areas = [
  { icon: GraduationCap, ar: "علمي", it: "Scientifico" },
  { icon: Users, ar: "تدريبي", it: "Formativo" },
  { icon: HeartHandshake, ar: "اجتماعي", it: "Sociale" },
  { icon: Tv, ar: "إعلامي", it: "Media" },
  { icon: Megaphone, ar: "دعوي", it: "Da'wah" },
];

export default function Partnerships() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ org: "", contact: "", email: "", country: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.org || !form.email || !form.message) {
      toast.error(t("يرجى استكمال الحقول المطلوبة", "Compila i campi obbligatori"));
      return;
    }
    toast.success(t("تم استلام طلبكم. سنتواصل معكم قريبًا.", "Richiesta ricevuta. Vi contatteremo presto."));
    setForm({ org: "", contact: "", email: "", country: "", message: "" });
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "الشراكات", it: "Collaborazioni" }}
        title={{ ar: "التعاون والشراكات المؤسسية", it: "Collaborazioni e partnership istituzionali" }}
        description={{
          ar: "يتعاون الاتحاد مع المؤسسات الإسلامية والعلمية داخل أوروبا وخارجها بما يخدم القيم الإنسانية والدعوية.",
          it: "L'Unione collabora con istituzioni islamiche e scientifiche in Europa e all'estero, al servizio dei valori umani, educativi e religiosi.",
        }}
      />

      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <h2 className="heading-section">{t("مجالات التعاون", "Aree di collaborazione")}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {areas.map((a, i) => (
              <div key={i} className="card-elegant p-6 text-center">
                <a.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="font-semibold">{t(a.ar, a.it)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-gradient-soft">
        <div className="container-narrow grid lg:grid-cols-[1fr,1.4fr] gap-10">
          <div>
            <h2 className="heading-section mb-4">{t("طلب شراكة مؤسسية", "Richiedi una collaborazione")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {t(ui.partnerCta.ar, ui.partnerCta.it)}
            </p>
            <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 text-primary font-semibold">
              <Mail className="h-4 w-4" /> {site.email}
            </a>
          </div>

          <form onSubmit={submit} className="card-elegant p-8 space-y-4">
            <div>
              <Label htmlFor="org">{t("اسم المؤسسة *", "Nome dell'organizzazione *")}</Label>
              <Input id="org" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact">{t("الشخص المسؤول", "Persona di contatto")}</Label>
                <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="email">{t("البريد الإلكتروني *", "Email *")}</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label htmlFor="country">{t("الدولة", "Paese")}</Label>
              <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="message">{t("الرسالة *", "Messaggio *")}</Label>
              <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full" size="lg">{t(ui.send.ar, ui.send.it)}</Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
