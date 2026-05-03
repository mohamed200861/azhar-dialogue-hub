// Lightweight runtime SEO helper. Updates document title and Open Graph /
// Twitter Card meta tags so that links shared on social platforms display
// the correct preview when JS executes (most modern crawlers do).
//
// For platforms that do NOT execute JS (some link unfurlers), `index.html`
// also ships with sane static defaults.

type SeoOptions = {
  title?: string;
  description?: string;
  image?: string; // absolute or root-relative
  type?: "website" | "article";
  url?: string;
};

const SITE_NAME = "اتحاد علماء الأزهر";
const DEFAULT_DESC = "اتحاد علماء الأزهر — مؤسسة إسلامية دعوية علمية غير ربحية تنشر المنهج الأزهري الوسطي وتخدم قضايا الأمة.";
const DEFAULT_OG = "/og-image.png";

function siteOrigin(): string {
  const env = (import.meta as any).env?.VITE_SITE_URL as string | undefined;
  if (env) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = siteOrigin();
  if (!origin) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
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

export function applySeo(opts: SeoOptions = {}) {
  const title = opts.title ? `${opts.title} — ${SITE_NAME}` : SITE_NAME;
  const description = opts.description || DEFAULT_DESC;
  const image = absoluteUrl(opts.image || DEFAULT_OG);
  const url = absoluteUrl(opts.url || (typeof window !== "undefined" ? window.location.pathname : "/"));
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
}

export function useSeo(opts: SeoOptions) {
  // Tiny effect helper — used inline to avoid importing react in non-component files.
  if (typeof window !== "undefined") applySeo(opts);
}
