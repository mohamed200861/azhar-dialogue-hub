/**
 * Build an optimized Supabase Storage image URL using the public render
 * transform endpoint. Falls through unchanged for non-Supabase URLs or
 * non-public storage URLs.
 *
 * Public: /storage/v1/object/public/<bucket>/<path>
 * Render: /storage/v1/render/image/public/<bucket>/<path>?width=...&quality=...&resize=cover
 */
export function optimizedImage(
  src?: string | null,
  opts: { width?: number; quality?: number; resize?: "cover" | "contain" | "fill" } = {},
): string | undefined {
  if (!src) return undefined;
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.href : "https://x");
    if (!/\.supabase\.co$/i.test(url.hostname) && !/\.supabase\.in$/i.test(url.hostname)) {
      return src;
    }
    const marker = "/storage/v1/object/public/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return src;
    const tail = url.pathname.slice(idx + marker.length);
    const ext = tail.split(".").pop()?.toLowerCase();
    // SVG/GIF should not be transformed.
    if (ext === "svg" || ext === "gif") return src;
    const width = Math.max(120, Math.min(1600, opts.width ?? 600));
    const quality = Math.max(40, Math.min(90, opts.quality ?? 70));
    const resize = opts.resize ?? "cover";
    const params = new URLSearchParams({ width: String(width), quality: String(quality), resize });
    return `${url.origin}/storage/v1/render/image/public/${tail}?${params.toString()}`;
  } catch {
    return src;
  }
}
