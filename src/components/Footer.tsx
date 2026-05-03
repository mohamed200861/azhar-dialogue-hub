import { Link } from "react-router-dom";
import { Mail, Facebook, MapPin, Twitter, Youtube, Instagram } from "lucide-react";
import { nav, ui, site } from "@/i18n/content";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Footer() {
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setBusy(true);
    const { data: existing } = await supabase
      .from("newsletter_subscribers").select("id").eq("email", email).maybeSingle();
    if (existing) {
      toast.info("هذا البريد الإلكتروني مشترك بالفعل.");
      setBusy(false); setEmail(""); return;
    }
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setBusy(false);
    if (error) { toast.error("تعذر الاشتراك. حاول لاحقًا."); return; }
    toast.success("تم الاشتراك في النشرة البريدية بنجاح.");
    setEmail("");
  };

  const year = new Date().getFullYear();
  const contentCol = [
    { label: "بيانات رسمية", href: "/news" },
    { label: "أخبار الاتحاد", href: "/news" },
    { label: "مقالات", href: "/news" },
    { label: "قضايا معاصرة", href: "/news" },
    { label: "إصدارات الاتحاد", href: "/library" },
  ];
  const specializedCol = [
    { label: "الفتوى والتحكيم الشرعي", href: "/fatwa-arbitration" },
    { label: "أكاديمية العلوم الشرعية", href: "/sharia-academy" },
    { label: "الحوار والتواصل الحضاري", href: "/civilizational-dialogue" },
    { label: "البحوث والدراسات", href: "/research-studies" },
    { label: "نشرة الأخبار", href: "/newsletter" },
  ];

  const socials = [
    { url: settings.facebook_url, Icon: Facebook, label: "فيسبوك" },
    { url: settings.twitter_url, Icon: Twitter, label: "تويتر" },
    { url: settings.youtube_url, Icon: Youtube, label: "يوتيوب" },
    { url: settings.instagram_url, Icon: Instagram, label: "إنستغرام" },
  ].filter((s) => s.url);

  return (
    <footer className="mt-20 bg-primary-deep text-primary-foreground">
      <div className="border-b border-white/10">
        <div className="container-wide py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-2">{ui.newsletterTitle}</h3>
            <p className="text-primary-foreground/80 text-sm">{ui.newsletterDesc}</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ui.emailPlaceholder}
              className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
              dir="rtl"
              disabled={busy}
            />
            <Button type="submit" variant="secondary" className="bg-white text-primary hover:bg-white/90 shrink-0" disabled={busy}>
              {ui.subscribe}
            </Button>
          </form>
        </div>
      </div>

      <div className="container-wide py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="bg-white/95 rounded-2xl p-3 inline-block">
            <Logo size={56} />
          </div>
          <p className="text-sm leading-relaxed text-primary-foreground/80 max-w-xs">
            مؤسسة إسلامية دعوية علمية غير ربحية تنشر المنهج الأزهري الوسطي وتخدم قضايا الأمة.
          </p>
          <div className="text-xs text-primary-foreground/70">« {settings.site_slogan} »</div>

          <div className="space-y-2 pt-2 text-sm text-primary-foreground/80">
            <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 hover:text-primary-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-all">{settings.contact_email}</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {site.hq.ar}
            </div>
            <div className="flex items-center gap-3 pt-1">
              {socials.map(({ url, Icon, label }) => (
                <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label}
                   className="hover:text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">الأقسام الرئيسية</h4>
          <ul className="space-y-2.5 text-sm">
            {nav.map((item) => (
              <li key={item.key}>
                <Link to={item.href} className="text-primary-foreground/75 hover:text-primary-foreground transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">المحتوى</h4>
          <ul className="space-y-2.5 text-sm">
            {contentCol.map((item, i) => (
              <li key={i}>
                <Link to={item.href} className="text-primary-foreground/75 hover:text-primary-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">أقسام متخصصة</h4>
          <ul className="space-y-2.5 text-sm">
            {specializedCol.map((item, i) => (
              <li key={i}>
                <Link to={item.href} className="text-primary-foreground/75 hover:text-primary-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-wide py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/70">
          <div>© {year} — {settings.footer_text || ui.copyright}</div>
          <div className="flex items-center gap-4">
            <Link to="/contact" className="hover:text-primary-foreground">تواصل معنا</Link>
            <Link to="/privacy" className="hover:text-primary-foreground">سياسة الخصوصية</Link>
            <Link to="/terms" className="hover:text-primary-foreground">الأحكام والشروط</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
