import logo from "@/assets/logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { site } from "@/i18n/content";
import { Link } from "react-router-dom";

export function Logo({ size = 44, withText = false }: { size?: number; withText?: boolean }) {
  const { t, lang } = useLanguage();
  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label={t(site.name.ar, site.name.it)}>
      <img
        src={logo}
        alt={t(site.name.ar, site.name.it)}
        width={size}
        height={size}
        className="object-contain transition-transform group-hover:scale-105"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="leading-tight">
          <div className={`font-bold text-foreground ${lang === "ar" ? "text-base" : "text-sm"}`}>
            {t(site.name.ar, site.name.it)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {t(site.slogan.ar, site.slogan.it)}
          </div>
        </div>
      )}
    </Link>
  );
}
