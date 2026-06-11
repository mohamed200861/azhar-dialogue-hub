import { memo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, BookOpen, FileText, BookMarked,
  PlayCircle, Mic, Calendar, Gavel, GraduationCap, MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { formatDate } from "@/lib/admin-utils";
import { optimizedImage } from "@/lib/supabase-image";
import { ui } from "@/i18n/content";
import type { PublicationItem } from "@/lib/latest-publications";

const ICONS: Record<string, LucideIcon> = {
  Newspaper, BookOpen, FileText, BookMarked, PlayCircle,
  Mic, Calendar, Gavel, GraduationCap, MessageCircle,
};

const TYPE_TONE: Record<PublicationItem["type"], string> = {
  news: "bg-primary/10 text-primary",
  library: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  research: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  quran_lesson: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  quran_video: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  khutbah: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  video: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  event: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  fatwa_file: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  academy: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  dialogue: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
};

function PublicationCardImpl({ item, priority = false }: { item: PublicationItem; priority?: boolean }) {
  const Icon = ICONS[item.icon] ?? Newspaper;
  const tone = TYPE_TONE[item.type];
  const optimized = optimizedImage(item.cover, { width: 720, quality: 70 });

  return (
    <Link
      to={item.href}
      aria-label={`${item.badge}: ${item.title}`}
      className="card-elegant overflow-hidden flex flex-col group h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <SmartImage
          src={optimized}
          alt={item.title}
          variant={item.variant}
          fallbackClassName="bg-gradient-emerald"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          priority={priority}
          sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 25vw"
          width={720}
          height={450}
        />
        {priority && item.cover && (
          // Inline preload hint for the browser preloader.
          <link rel="preload" as="image" href={optimized || item.cover} />
        )}
        <span
          className={`absolute top-3 start-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur bg-background/85 ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {item.badge}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[11px] text-muted-foreground mb-2">
          {formatDate(item.date)}
          {item.meta ? <span className="mx-1.5">•</span> : null}
          {item.meta ? <span className="font-medium text-foreground/70">{item.meta}</span> : null}
        </div>
        <h3 className="font-bold text-[15px] md:text-base mb-2 line-clamp-2 leading-snug">
          {item.title}
        </h3>
        {item.excerpt ? (
          <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3 flex-1">
            {item.excerpt}
          </p>
        ) : <div className="flex-1" />}
        <span className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all mt-auto">
          {ui.readMore} <ArrowLeft className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export const PublicationCard = memo(PublicationCardImpl);
