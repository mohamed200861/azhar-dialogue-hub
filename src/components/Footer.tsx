import { Link } from "react-router-dom";
import { Mail, Facebook, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { nav, site, ui } from "@/i18n/content";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(t("يرجى إدخال بريد إلكتروني صحيح", "Inserisci un'email valida"));
      return;
    }
    toast.success(t("تم الاشتراك بنجاح", "Iscrizione completata"));
    setEmail("");
  };

  const year = new Date().getFullYear();
  const cols = [
    nav.slice(0, 5),
    nav.slice(5),
  ];

  return (
    <footer className="mt-20 bg-primary-deep text-primary-foreground">
      <div className="container-wide py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="bg-white/95 rounded-2xl p-3 inline-block">
            <Logo size={56} />
          </div>
          <p className="text-sm leading-relaxed text-primary-foreground/80 max-w-xs">
            {t(
              "مؤسسة إسلامية دعوية علمية غير ربحية تنشر المنهج الأزهري الوسطي وتخدم قضايا الأمة.",
              "Istituzione islamica, scientifica e non profit che diffonde il metodo azharita moderato e serve la comunità."
            )}
          </p>
          <div className="text-xs italic text-primary-foreground/70 font-serif">
            « {t(site.slogan.ar, site.slogan.it)} »
          </div>
        </div>

        {cols.map((col, i) => (
          <div key={i}>
            <h4 className="font-semibold mb-4 text-primary-foreground">
              {i === 0 ? t("روابط سريعة", "Link rapidi") : t("استكشف", "Esplora")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {col.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.href}
                    className="text-primary-foreground/75 hover:text-primary-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    {t(item.label.ar, item.label.it)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-4">
          <h4 className="font-semibold text-primary-foreground">{t(ui.newsletterTitle.ar, ui.newsletterTitle.it)}</h4>
          <p className="text-sm text-primary-foreground/75">
            {t(ui.newsletterDesc.ar, ui.newsletterDesc.it)}
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t(ui.emailPlaceholder.ar, ui.emailPlaceholder.it)}
              className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
            <Button type="submit" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              {t(ui.subscribe.ar, ui.subscribe.it)}
            </Button>
          </form>

          <div className="space-y-2 pt-4 text-sm text-primary-foreground/80">
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-primary-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-all">{site.email}</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {t(site.hq.ar, site.hq.it)}
            </div>
            <a
              href={site.facebook}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-primary-foreground"
            >
              <Facebook className="h-4 w-4 shrink-0" />
              Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-wide py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/70">
          <div>{t(ui.copyright.ar, ui.copyright.it)} — {year}</div>
          <div>{t("تأسس عام", "Fondata nel")} {site.founded}</div>
        </div>
      </div>
    </footer>
  );
}
