import { useState } from "react";
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
  /** Tailwind classes for the fallback wrapper (e.g. background gradient). */
  fallbackClassName?: string;
  /** Optional override icon */
  icon?: LucideIcon;
}

/** Image with graceful fallback (custom icon) when src is missing or broken. */
export function SmartImage({
  src,
  alt,
  variant = "general",
  fallbackClassName,
  icon,
  className,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);
  const Icon = icon ?? ICONS[variant];
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary-glow/10",
          fallbackClassName,
          className
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
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
