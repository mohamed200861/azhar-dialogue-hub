import { Link } from "react-router-dom";
import logoDefault from "@/assets/logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Logo({ size = 44, withText = false }: { size?: number; withText?: boolean }) {
  const { settings } = useSiteSettings();
  const logoSrc = settings.logo_url || logoDefault;
  const name = settings.site_name || "اتحاد علماء الأزهر";
  const slogan = settings.site_slogan || "منهج أزهري… ورسالة عالمية";
  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label={name}>
      <img
        src={logoSrc}
        alt={name}
        width={size}
        height={size}
        className="object-contain transition-transform group-hover:scale-105"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="leading-tight">
          <div className="font-bold text-foreground text-base">{name}</div>
          <div className="text-[11px] text-muted-foreground">{slogan}</div>
        </div>
      )}
    </Link>
  );
}
