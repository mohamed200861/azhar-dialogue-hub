import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { site, ui } from "@/i18n/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Facebook } from "lucide-react";
import { toast } from "sonner";

const reasons = [
  { ar: "استفسار عام", it: "Richiesta generica" },
  { ar: "شراكة", it: "Collaborazione" },
  { ar: "طلب إعلامي", it: "Richiesta media" },
  { ar: "طلب فعالية", it: "Richiesta evento" },
  { ar: "المكتبة / الإصدارات", it: "Biblioteca / pubblicazioni" },
  { ar: "أخرى", it: "Altro" },
];

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", subject: "", reason: reasons[0].ar, message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(t("يرجى استكمال الحقول المطلوبة", "Compila i campi obbligatori"));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error(t("بريد إلكتروني غير صحيح", "Email non valida"));
      return;
    }
    toast.success(t(
      "تم إرسال رسالتك بنجاح. سنقوم بالرد عليك في أقرب وقت ممكن.",
      "Il tuo messaggio è stato inviato con successo. Ti risponderemo il prima possibile."
    ));
    setForm({ name: "", email: "", subject: "", reason: reasons[0].ar, message: "" });
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow={{ ar: "تواصل", it: "Contatti" }}
        title={{ ar: "تواصل معنا", it: "Contattaci" }}
        description={{
          ar: "يسعدنا تواصلكم لأي استفسار أو اقتراح أو طلب تعاون.",
          it: "Saremo felici di rispondere a qualsiasi richiesta, suggerimento o proposta di collaborazione.",
        }}
      />

      <section className="section-padding">
        <div className="container-narrow grid lg:grid-cols-[1fr,1.5fr] gap-10">
          <div className="space-y-4">
            <a href={`mailto:${site.email}`} className="card-elegant p-6 flex items-start gap-4 block hover:bg-muted/30 transition-colors">
              <Mail className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("البريد الإلكتروني", "Email")}</div>
                <div className="font-semibold mt-1 break-all">{site.email}</div>
              </div>
            </a>
            <div className="card-elegant p-6 flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("المقر", "Sede")}</div>
                <div className="font-semibold mt-1">{t(site.hq.ar, site.hq.it)}</div>
              </div>
            </div>
            <a href={site.facebook} target="_blank" rel="noreferrer" className="card-elegant p-6 flex items-start gap-4 block hover:bg-muted/30 transition-colors">
              <Facebook className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Facebook</div>
                <div className="font-semibold mt-1">{t("صفحة الاتحاد الرسمية", "Pagina ufficiale")}</div>
              </div>
            </a>
          </div>

          <form onSubmit={submit} className="card-elegant p-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t("الاسم الكامل *", "Nome completo *")}</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email">{t("البريد الإلكتروني *", "Email *")}</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">{t("الموضوع", "Oggetto")}</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="reason">{t("سبب التواصل", "Motivo del contatto")}</Label>
              <select
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {reasons.map((r, i) => (
                  <option key={i} value={r.ar}>{t(r.ar, r.it)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="message">{t("الرسالة *", "Messaggio *")}</Label>
              <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <Button type="submit" size="lg" className="w-full">{t(ui.send.ar, ui.send.it)}</Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
