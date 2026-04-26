/**
 * Generate URL-safe slug. For Arabic text, fall back to a timestamp+random
 * suffix when the result contains no ASCII chars, so the column stays unique.
 */
export function slugify(input: string): string {
  const base = (input || "")
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u0652]/g, "") // strip Arabic diacritics
    .replace(/[^a-z0-9\u0621-\u064A\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  if (!base || !/[a-z0-9]/.test(base)) {
    return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return base;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

export function formatBytes(n: number | null | undefined): string {
  if (!n && n !== 0) return "—";
  const units = ["بايت", "ك.ب", "م.ب", "ج.ب"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function getYouTubeEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (/facebook\.com/.test(url)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
  }
  return null;
}
