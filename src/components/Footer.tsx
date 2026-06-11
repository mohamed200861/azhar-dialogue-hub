import { Link } from "react-router-dom";
import { Mail, Facebook, MapPin, Twitter, Youtube, Instagram, Download, Share } from "lucide-react";
import { nav, ui } from "@/i18n/content";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useInstallPrompt } from "./InstallPrompt";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function Footer() {
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const install = useInstallPrompt();

  const onInstallClick = async () => {
    const result = await install.install();
    if (result === "ios" || result === "unavailable") setShowIosHelp(true);
  };

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
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-primary-foreground/90">مجال العمل</div>
                <div className="text-primary-foreground/75">خدمة علمية ودعوية عالمية</div>
              </div>
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
          <h4 className="font-semibold mb-4">الأقسام المتخصصة</h4>
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

      {!install.isStandalone && (
        <div className="border-t border-white/10">
          <div className="container-wide py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-primary-foreground/80">
              ثبّت تطبيق اتحاد علماء الأزهر على جهازك للوصول السريع.
            </p>
            <Button
              onClick={onInstallClick}
              size="sm"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Download className="h-4 w-4 ml-1.5" />
              تثبيت التطبيق
            </Button>
          </div>
        </div>
      )}

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

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>تثبيت التطبيق على جهازك</DialogTitle>
            <DialogDescription>
              اتبع الخطوات التالية حسب المتصفح:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">على iPhone / iPad (Safari)</p>
              <ol className="list-decimal pr-5 space-y-1 text-muted-foreground">
                <li>اضغط زر المشاركة <Share className="inline h-3.5 w-3.5" /> في الأسفل.</li>
                <li>اختر "إضافة إلى الشاشة الرئيسية".</li>
                <li>اضغط "إضافة".</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold mb-1">على Android (Chrome / Samsung)</p>
              <ol className="list-decimal pr-5 space-y-1 text-muted-foreground">
                <li>افتح قائمة المتصفح (⋮).</li>
                <li>اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
