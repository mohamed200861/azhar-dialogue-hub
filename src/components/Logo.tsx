import { Link } from "react-router-dom";
import logoDefault from "@/assets/logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useState } from "react";

export function Logo({ size = 44, withText = false }: { size?: number; withText?: boolean }) {
  const { settings } = useSiteSettings();
  const [errored, setErrored] = useState(false);
  const logoSrc = !errored && settings.logo_url ? settings.logo_url : logoDefault;
  const name = settings.site_name || "اتحاد علماء الأزهر";
  const slogan = settings.site_slogan || "منهج أزهري… ورسالة عالمية";

  // SVGs from external storage often lack intrinsic width/height attributes,
  // which causes <img> to render at 0×0. Render those via background-image so
  // the box always has explicit dimensions regardless of the SVG viewBox.
  const isSvg = typeof logoSrc === "string" && /\.svg(\?|$)/i.test(logoSrc);

  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label={name}>
      {isSvg ? (
        <span
          role="img"
          aria-label={name}
          className="block transition-transform group-hover:scale-105"
          style={{
            width: size,
            height: size,
            backgroundImage: `url("${logoSrc}")`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <img
          key={logoSrc}
          src={logoSrc}
          alt={name}
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          onError={() => setErrored(true)}
          className="object-contain transition-transform group-hover:scale-105"
          style={{ width: size, height: size }}
        />
      )}
      {withText && (
        <div className="leading-tight">
          <div className="font-bold text-foreground text-base">{name}</div>
          <div className="text-[11px] text-muted-foreground">{slogan}</div>
        </div>
      )}
    </Link>
  );
}
