/**
 * Image URL helpers.
 *
 * Supabase Storage supports on-the-fly image transforms via query params
 * (`?width=&quality=&format=`). For public buckets the transformed asset is
 * served from the same CDN edge, so this is a real payload reduction — a
 * 2 MB JPEG uploaded full-size becomes a ~60-120 KB WebP at the rendered size.
 *
 * Non-Supabase URLs and SVGs are returned unchanged so this is always safe.
 */

const SUPABASE_HOST_MATCH = /\.supabase\.(co|in)\/storage\/v1\/object\/public\//;

export interface ImageTransform {
  width?: number;
  quality?: number; // 20-100
  format?: "origin" | "auto";
}

function isTransformable(url: string): boolean {
  if (!url) return false;
  if (/\.svg(\?|$)/i.test(url)) return false;
  return SUPABASE_HOST_MATCH.test(url);
}

/** Append width/quality to a Supabase public storage URL. Safe no-op otherwise. */
export function imageUrl(src: string | null | undefined, t: ImageTransform = {}): string {
  if (!src) return "";
  if (!isTransformable(src)) return src;
  const url = new URL(src);
  // Supabase transforms live under /render/image/public/, not /object/public/.
  url.pathname = url.pathname.replace("/object/public/", "/render/image/public/");
  if (t.width) url.searchParams.set("width", String(Math.round(t.width)));
  if (t.quality) url.searchParams.set("quality", String(Math.max(20, Math.min(100, t.quality))));
  if (t.format) url.searchParams.set("format", t.format);
  return url.toString();
}

/** Build a responsive srcset for the given widths. */
export function imageSrcSet(
  src: string | null | undefined,
  widths: number[] = [480, 768, 1200, 1600],
  quality = 78,
): string | undefined {
  if (!src || !isTransformable(src)) return undefined;
  return widths
    .map((w) => `${imageUrl(src, { width: w, quality, format: "auto" })} ${w}w`)
    .join(", ");
}
