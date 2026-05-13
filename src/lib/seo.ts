// Lightweight runtime SEO helper. Updates document title, Open Graph /
// Twitter Card meta tags, canonical URL, and optional JSON-LD so links
// shared on social platforms display the correct preview when JS executes
// (most modern crawlers do).
//
// For platforms that do NOT execute JS, `index.html` ships with sane
// static defaults plus sitewide Organization + WebSite JSON-LD.

type SeoOptions = {
  title?: string;
  description?: string;
  image?: string; // absolute or root-relative
  type?: "website" | "article";
  url?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const SITE_NAME = "اتحاد علماء الأزهر";
const DEFAULT_TITLE = "اتحاد علماء الأزهر — المنهج الأزهري الوسطي";
const DEFAULT_DESC =
  "اتحاد علماء الأزهر — مؤسسة إسلامية دعوية علمية غير ربحية تنشر المنهج الأزهري الوسطي وتخدم قضايا الأمة.";
const DEFAULT_OG = "/og-image.png";

const DEFAULT_SITE_URL = "https://alazharscholarunion.it";

function siteOrigin(): string {
  const env = (import.meta as any).env?.VITE_SITE_URL as string | undefined;
  if (env) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const o = window.location.origin;
    if (/lovable\.app$|pages\.dev$/i.test(o)) return DEFAULT_SITE_URL;
    return o;
  }
  return DEFAULT_SITE_URL;
}

function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = siteOrigin();
  if (!origin) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function clamp(text: string, max: number): string {
  if (!text) return text;
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data?: SeoOptions["jsonLd"]) {
  // Remove any previously-injected per-route JSON-LD blocks.
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-seo="route"]')
    .forEach((el) => el.remove());
  if (!data) return;
  const arr = Array.isArray(data) ? data : [data];
  for (const item of arr) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-seo", "route");
    s.text = JSON.stringify(item);
    document.head.appendChild(s);
  }
}

export function applySeo(opts: SeoOptions = {}) {
  const raw = (opts.title || "").trim();
  // Dedupe: if title already mentions the brand, don't append it again.
  let title: string;
  if (!raw) {
    title = DEFAULT_TITLE;
  } else if (raw.includes(SITE_NAME)) {
    title = raw;
  } else {
    title = `${raw} — ${SITE_NAME}`;
  }
  title = clamp(title, 70);

  const description = clamp((opts.description || DEFAULT_DESC).trim(), 160);
  const image = absoluteUrl(opts.image || DEFAULT_OG);
  const url = absoluteUrl(
    opts.url || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"),
  );
  const type = opts.type || "website";

  document.title = title;
  setMeta("name", "description", description);
  setLink("canonical", url);

  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", type);
  setMeta("property", "og:url", url);
  setMeta("property", "og:image", image);
  setMeta("property", "og:locale", "ar_AR");

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", image);

  setJsonLd(opts.jsonLd);
}

export function useSeo(opts: SeoOptions) {
  if (typeof window !== "undefined") applySeo(opts);
}
