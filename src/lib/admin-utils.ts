/**
 * Generate URL-safe slug. For Arabic text, fall back to a timestamp+random
 * suffix when the result contains no usable chars. Always strips slashes,
 * colons, protocols and whitespace so it can never produce a broken route.
 */
export function slugify(input: string): string {
  const base = (input || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/[\u064B-\u0652]/g, "") // strip Arabic diacritics
    .replace(/[^a-z0-9\u0621-\u064A\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!base || base.length < 2) {
    return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return base;
}

/** Sanitize a user-typed slug. Removes slashes, protocols, spaces. Never empty for routing. */
export function sanitizeSlug(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#:&]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

/**
 * Returns an embeddable iframe URL for a given video URL, supporting:
 * YouTube (watch / youtu.be / shorts / live / embed) and Facebook (videos / live).
 * Returns null if the URL cannot be embedded.
 */
export function getYouTubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;

  // YouTube — capture id from many formats
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/|v\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  // Facebook video / live
  if (/facebook\.com|fb\.watch/.test(u)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=0&autoplay=0`;
  }

  // Already an embed iframe URL
  if (/\/embed\//.test(u)) return u;

  return null;
}

/** Validate a URL string. Allows empty (treated as "no link"). */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const s = url.trim();
  if (!s) return true;
  try {
    const parsed = new URL(s);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Extract a friendly file name from a public URL. */
export function fileNameFromUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split("/").pop() || "");
    return name || url;
  } catch {
    return url.split("/").pop() || url;
  }
}

/** Detect whether a URL points to a PDF. */
export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.pdf(\?|#|$)/i.test(url);
}
