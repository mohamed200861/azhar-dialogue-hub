import { Link } from "react-router-dom";
import { Mail, Facebook, MapPin } from "lucide-react";
import { nav, site, ui } from "@/i18n/content";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    toast.success("تم الاشتراك في النشرة البريدية بنجاح.");
    setEmail("");
  };

  const year = new Date().getFullYear();

  const sectionsCol = nav;
  const contentCol = [
    { label: "بيانات رسمية", href: "/news" },
    { label: "أخبار الاتحاد", href: "/news" },
    { label: "مقالات", href: "/news" },
    { label: "قضايا معاصرة", href: "/news" },
    { label: "إصدارات الاتحاد", href: "/library" },
  ];
  const libraryCol = [
    { label: "كتب", href: "/library" },
    { label: "ملفات PDF", href: "/library" },
    { label: "بحوث علمية", href: "/library" },
    { label: "مجلات", href: "/library" },
    { label: "مواد تدريبية", href: "/library" },
  ];

  return (
    <footer className="mt-20 bg-primary-deep text-primary-foreground">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="container-wide py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-2">{ui.newsletterTitle.ar}</h3>
            <p className="text-primary-foreground/80 text-sm">{ui.newsletterDesc.ar}</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ui.emailPlaceholder.ar}
              className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
              dir="rtl"
            />
            <Button type="submit" variant="secondary" className="bg-white text-primary hover:bg-white/90 shrink-0">
              {ui.subscribe.ar}
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
          <div className="text-xs text-primary-foreground/70">« {site.slogan.ar} »</div>

          <div className="space-y-2 pt-2 text-sm text-primary-foreground/80">
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-primary-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-all">{site.email}</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {site.hq.ar}
            </div>
            <a href={site.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary-foreground">
              <Facebook className="h-4 w-4 shrink-0" />
              فيسبوك
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">الأقسام الرئيسية</h4>
          <ul className="space-y-2.5 text-sm">
            {sectionsCol.map((item) => (
              <li key={item.key}>
                <Link to={item.href} className="text-primary-foreground/75 hover:text-primary-foreground transition-colors">
                  {item.label.ar}
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
          <h4 className="font-semibold mb-4">المكتبة</h4>
          <ul className="space-y-2.5 text-sm">
            {libraryCol.map((item, i) => (
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
          <div>© {year} — {ui.copyright.ar}</div>
          <div className="flex items-center gap-4">
            <Link to="/contact" className="hover:text-primary-foreground">تواصل معنا</Link>
            <span className="opacity-50">سياسة الخصوصية</span>
            <span className="opacity-50">الأحكام والشروط</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
