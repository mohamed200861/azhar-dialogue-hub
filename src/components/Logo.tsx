import logo from "@/assets/logo.png";
import { site } from "@/i18n/content";
import { Link } from "react-router-dom";

export function Logo({ size = 44, withText = false }: { size?: number; withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label={site.name.ar}>
      <img
        src={logo}
        alt={site.name.ar}
        width={size}
        height={size}
        className="object-contain transition-transform group-hover:scale-105"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="leading-tight">
          <div className="font-bold text-foreground text-base">
            {site.name.ar}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {site.slogan.ar}
          </div>
        </div>
      )}
    </Link>
  );
}
