import { supabase } from "@/integrations/supabase/client";

/**
 * Unified publication item used by the homepage feed.
 * Normalizes content from every public publishable source.
 */
export type PublicationType =
  | "news"
  | "library"
  | "research"
  | "quran_lesson"
  | "quran_video"
  | "khutbah"
  | "video"
  | "event"
  | "fatwa_file"
  | "academy"
  | "dialogue";

export interface PublicationItem {
  id: string;
  type: PublicationType;
  badge: string;
  title: string;
  excerpt?: string | null;
  cover?: string | null;
  date: string; // ISO
  href: string;
  meta?: string | null; // author/speaker/publisher
  icon: string; // lucide name handled by the card
  variant: "news" | "library" | "video" | "event" | "general";
}

const BADGES: Record<PublicationType, string> = {
  news: "خبر",
  library: "مكتبة",
  research: "بحث",
  quran_lesson: "درس قرآني",
  quran_video: "فيديو قرآني",
  khutbah: "خطبة",
  video: "فيديو",
  event: "فعالية",
  fatwa_file: "فتوى",
  academy: "أكاديمية",
  dialogue: "حوار حضاري",
};

const ICON: Record<PublicationType, string> = {
  news: "Newspaper",
  library: "BookOpen",
  research: "FileText",
  quran_lesson: "BookMarked",
  quran_video: "PlayCircle",
  khutbah: "Mic",
  video: "PlayCircle",
  event: "Calendar",
  fatwa_file: "Gavel",
  academy: "GraduationCap",
  dialogue: "MessageCircle",
};

const VARIANT: Record<PublicationType, PublicationItem["variant"]> = {
  news: "news",
  library: "library",
  research: "library",
  quran_lesson: "video",
  quran_video: "video",
  khutbah: "video",
  video: "video",
  event: "event",
  fatwa_file: "library",
  academy: "library",
  dialogue: "general",
};

function mk(type: PublicationType, partial: Omit<PublicationItem, "type" | "badge" | "icon" | "variant">): PublicationItem {
  return {
    type,
    badge: BADGES[type],
    icon: ICON[type],
    variant: VARIANT[type],
    ...partial,
  };
}

/**
 * Fetches the latest publications across every public content source.
 * Each source is pulled in parallel and capped; the merged list is sorted
 * by date descending and trimmed to `limit`.
 */
export async function fetchLatestPublications(limit = 18): Promise<PublicationItem[]> {
  const perSource = 6;

  const results = await Promise.allSettled([
    supabase.from("news_posts")
      .select("id,slug,title,excerpt,cover_image,publisher_source,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(perSource),
    supabase.from("library_items")
      .select("id,slug,title,description,cover_image,publisher_source,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(perSource),
    supabase.from("research_items")
      .select("id,title,abstract,cover_image,author,published_at,created_at")
      .eq("publish_status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(perSource),
    supabase.from("quran_lessons")
      .select("id,slug,title,description,thumbnail,published_at,created_at")
      .eq("publish_status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(perSource),
    supabase.from("quran_videos")
      .select("id,title,description,thumbnail,published_at,created_at")
      .eq("publish_status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(perSource),
    supabase.from("khutbahs")
      .select("id,slug,title,description,featured_image,speaker_name,published_at,created_at")
      .eq("publish_status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(perSource),
    supabase.from("videos")
      .select("id,slug,title,description,thumbnail,publisher_source,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase.from("events")
      .select("id,slug,title,description,cover_image,organizer_source,start_datetime,created_at")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase.from("fatwa_public_files")
      .select("id,title,description,created_at")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase.from("academy_programs")
      .select("id,title,description,category,created_at")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase.from("dialogue_initiatives")
      .select("id,title,description,initiative_date,created_at")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(perSource),
  ]);

  const get = (i: number): any[] => {
    const r = results[i];
    if (r.status !== "fulfilled") return [];
    return (r.value as any)?.data ?? [];
  };

  const items: PublicationItem[] = [];

  for (const n of get(0)) items.push(mk("news", {
    id: `news:${n.id}`, title: n.title, excerpt: n.excerpt, cover: n.cover_image,
    date: n.published_at ?? n.created_at, href: `/news/${n.slug || n.id}`, meta: n.publisher_source,
  }));
  for (const n of get(1)) items.push(mk("library", {
    id: `library:${n.id}`, title: n.title, excerpt: n.description, cover: n.cover_image,
    date: n.published_at ?? n.created_at, href: `/library/${n.slug || n.id}`, meta: n.publisher_source,
  }));
  for (const n of get(2)) items.push(mk("research", {
    id: `research:${n.id}`, title: n.title, excerpt: n.abstract, cover: n.cover_image,
    date: n.published_at ?? n.created_at, href: `/research-studies`, meta: n.author,
  }));
  for (const n of get(3)) items.push(mk("quran_lesson", {
    id: `qlesson:${n.id}`, title: n.title, excerpt: n.description, cover: n.thumbnail,
    date: n.published_at ?? n.created_at, href: `/quran/${n.slug || n.id}`, meta: null,
  }));
  for (const n of get(4)) items.push(mk("quran_video", {
    id: `qvideo:${n.id}`, title: n.title, excerpt: n.description, cover: n.thumbnail,
    date: n.published_at ?? n.created_at, href: `/quran`, meta: null,
  }));
  for (const n of get(5)) items.push(mk("khutbah", {
    id: `khutbah:${n.id}`, title: n.title, excerpt: n.description, cover: n.featured_image,
    date: n.published_at ?? n.created_at, href: `/khutbahs/${n.slug || n.id}`, meta: n.speaker_name,
  }));
  for (const n of get(6)) items.push(mk("video", {
    id: `video:${n.id}`, title: n.title, excerpt: n.description, cover: n.thumbnail,
    date: n.created_at, href: `/videos/${n.slug || n.id}`, meta: n.publisher_source,
  }));
  for (const n of get(7)) items.push(mk("event", {
    id: `event:${n.id}`, title: n.title, excerpt: n.description, cover: n.cover_image,
    date: n.start_datetime ?? n.created_at, href: `/events/${n.slug || n.id}`, meta: n.organizer_source,
  }));
  for (const n of get(8)) items.push(mk("fatwa_file", {
    id: `fatwa:${n.id}`, title: n.title, excerpt: n.description, cover: null,
    date: n.created_at, href: `/fatwa-arbitration`, meta: null,
  }));
  for (const n of get(9)) items.push(mk("academy", {
    id: `academy:${n.id}`, title: n.title, excerpt: n.description, cover: null,
    date: n.created_at, href: `/sharia-academy`, meta: n.category,
  }));
  for (const n of get(10)) items.push(mk("dialogue", {
    id: `dialogue:${n.id}`, title: n.title, excerpt: n.description, cover: null,
    date: n.initiative_date ?? n.created_at, href: `/civilizational-dialogue`, meta: null,
  }));

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, limit);
}

/** Tables to listen for realtime publish events */
export const PUBLICATION_TABLES = [
  "news_posts", "library_items", "research_items",
  "quran_lessons", "quran_videos", "khutbahs", "videos", "events",
  "fatwa_public_files", "academy_programs", "dialogue_initiatives",
] as const;
