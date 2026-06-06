import { useEffect, useRef, useState } from "react";
import { BookOpen, Newspaper, PlayCircle, Calendar, Image as ImageIcon, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { imageUrl, imageSrcSet } from "@/lib/image-url";

type Variant = "library" | "news" | "video" | "event" | "general";

const ICONS: Record<Variant, LucideIcon> = {
  library: BookOpen,
  news: Newspaper,
  video: PlayCircle,
  event: Calendar,
  general: ImageIcon,
};

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  variant?: Variant;
  fallbackClassName?: string;
  icon?: LucideIcon;
  /** Target rendered width in CSS px (used to pick transformed size). */
  renderWidth?: number;
  /** Provide srcset for responsive loading (Supabase storage only). */
  responsive?: boolean;
  /** sizes attribute when responsive */
  sizes?: string;
}

/**
 * Image with:
 *  - graceful icon fallback when src is missing/broken
 *  - state reset when src prop changes (fixes "image shows 1/10 times" bug
 *    where a prior failed render left `failed=true` forever)
 *  - one automatic retry with cache-busting query string on first error
 *    (handles transient CDN 5xx / cold-cache misses)
 *  - automatic Supabase Storage transform + srcset for real payload savings
 */
export function SmartImage({
  src,
  alt,
  variant = "general",
  fallbackClassName,
  icon,
  className,
  renderWidth,
  responsive = true,
  sizes,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);
  const retryRef = useRef(0);
  const Icon = icon ?? ICONS[variant];

  // Reset error state whenever src changes so a transient failure on a
  // previous URL doesn't permanently hide the new one.
  useEffect(() => {
    setFailed(false);
    retryRef.current = 0;
  }, [src]);

  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary-glow/10",
          fallbackClassName,
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <Icon className="h-1/3 w-1/3 max-h-20 max-w-20 text-primary/40" />
      </div>
    );
  }

  const finalSrc = renderWidth
    ? imageUrl(src!, { width: renderWidth, quality: 80, format: "auto" })
    : src!;
  const srcSet = responsive ? imageSrcSet(src!) : undefined;

  return (
    <img
      src={finalSrc}
      srcSet={srcSet}
      sizes={sizes ?? (srcSet ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px" : undefined)}
      alt={alt}
      loading={rest.loading ?? "lazy"}
      decoding={rest.decoding ?? "async"}
      onError={(e) => {
        // Single retry with cache-bust before giving up.
        if (retryRef.current === 0 && src) {
          retryRef.current = 1;
          const img = e.currentTarget;
          const bust = src.includes("?") ? "&" : "?";
          img.src = `${src}${bust}_r=${Date.now()}`;
          return;
        }
        setFailed(true);
      }}
      className={className}
      {...rest}
    />
  );
}
