import { useEffect, useState } from "react";
import { BookOpen, Newspaper, PlayCircle, Calendar, Image as ImageIcon, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  /** Mark as LCP-candidate: eager load, high priority, no lazy. */
  priority?: boolean;
}

/**
 * Image with graceful fallback (custom icon) when src is missing or broken.
 * One transparent retry (cache-bust) before showing the fallback to recover
 * from transient CDN / network flakes.
 */
export function SmartImage({
  src,
  alt,
  variant = "general",
  fallbackClassName,
  icon,
  className,
  priority,
  ...rest
}: Props) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || undefined);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || undefined);
    setAttempt(0);
    setFailed(false);
  }, [src]);

  const Icon = icon ?? ICONS[variant];
  const showFallback = !currentSrc || failed;

  const handleError = () => {
    if (attempt < 1 && src) {
      // Retry once with a cache-bust param.
      const sep = src.includes("?") ? "&" : "?";
      setCurrentSrc(`${src}${sep}_r=${Date.now()}`);
      setAttempt(1);
      if (import.meta.env.DEV) console.warn("[SmartImage] retry", src);
      return;
    }
    if (import.meta.env.DEV) console.warn("[SmartImage] failed", src);
    setFailed(true);
  };

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

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={priority ? "eager" : (rest.loading ?? "lazy")}
      decoding={priority ? "sync" : (rest.decoding ?? "async")}
      // @ts-expect-error fetchpriority is valid HTML, React 18 typing lag
      fetchpriority={priority ? "high" : undefined}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
}
