// Cloudflare Pages Function — runs on every request to the deployed site.
// Purpose: serve crawler-friendly Open Graph / Twitter / canonical meta tags
// to social media unfurlers (WhatsApp, Facebook, LinkedIn, Telegram, Twitter,
// Slack, Discord, Skype, Pinterest, etc.) which do NOT execute JavaScript.
//
// Real users (browsers) get the unmodified SPA. Only requests whose
// User-Agent matches a known social crawler are intercepted and their
// HTML <head> is rewritten with route-specific tags fetched from Supabase.
//
// On any error, the original SPA HTML is returned unchanged so the site
// never breaks.

const SUPABASE_URL = "https://jqyioadvwldtiszmpmlt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeWlvYWR2d2xkdGlzem1wbWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTI4ODIsImV4cCI6MjA5Mjc2ODg4Mn0.S4pt9nciWMVi7GXVfMOIcZrmHN33J9a-3LeXwED03j0";

const SITE_ORIGIN = "https://alazharscholarunion.it";
const SITE_NAME = "اتحاد علماء الأزهر";
const DEFAULT_DESC =
  "اتحاد علماء الأزهر — مؤسسة علمية ودعوية تنشر المنهج الأزهري الوسطي وتخدم العلم والحوار والفتوى والبحوث الشرعية.";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;

const CRAWLER_RE =
  /facebookexternalhit|facebookcatalog|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|skypeuripreview|pinterest|redditbot|embedly|quora link preview|outbrain|vkshare|w3c_validator|baiduspider|applebot|bingbot|googlebot|google-inspectiontool|yandexbot|duckduckbot|tumblr|nuzzel|bitlybot|chatwork|line|kakaotalk|viber/i;

type Meta = {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "article";
  publishedAt?: string;
  modifiedAt?: string;
  jsonLd?: Record<string, any>;
};

function abs(pathOrUrl: string | null | undefined, fallback: string): string {
  if (!pathOrUrl) return fallback;
  const v = String(pathOrUrl).trim();
  if (!v) return fallback;
  if (/^https?:\/\//i.test(v)) return v;
  return `${SITE_ORIGIN}${v.startsWith("/") ? "" : "/"}${v}`;
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(text: string, max = 200): string {
  if (!text) return text;
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

function escAttr(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sb<T = any>(
  table: string,
  qs: string,
  signal?: AbortSignal,
): Promise<T[] | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
      signal,
    });
    if (!r.ok) return null;
    return (await r.json()) as T[];
  } catch {
    return null;
  }
}

async function fetchOne(
  table: string,
  slug: string,
  selectFields: string,
  extraFilter = "",
): Promise<any | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
  const q1 = `select=${selectFields}&${isUuid ? "id" : "slug"}=eq.${encodeURIComponent(slug)}${extraFilter}&limit=1`;
  let rows = await sb(table, q1);
  if (rows && rows.length) return rows[0];
  const q2 = `select=${selectFields}&${isUuid ? "slug" : "id"}=eq.${encodeURIComponent(slug)}${extraFilter}&limit=1`;
  rows = await sb(table, q2);
  return rows && rows.length ? rows[0] : null;
}

async function metaForRoute(pathname: string, fullUrl: string): Promise<Meta | null> {
  const url = `${SITE_ORIGIN}${pathname}`;

  let m = pathname.match(/^\/news\/([^/?#]+)\/?$/);
  if (m) {
    const row = await fetchOne(
      "news_posts",
      decodeURIComponent(m[1]),
      "id,slug,title,excerpt,seo_title,seo_description,cover_image,category,published_at,updated_at,created_at,publisher_source",
      "&status=eq.published",
    );
    if (row) {
      return {
        title: row.seo_title || row.title,
        description: clamp(stripHtml(row.seo_description || row.excerpt) || DEFAULT_DESC),
        image: abs(row.cover_image, DEFAULT_IMAGE),
        url,
        type: "article",
        publishedAt: row.published_at || row.created_at,
        modifiedAt: row.updated_at || row.published_at || row.created_at,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: row.title,
          description: stripHtml(row.seo_description || row.excerpt) || undefined,
          image: row.cover_image ? [abs(row.cover_image, DEFAULT_IMAGE)] : undefined,
          datePublished: row.published_at || row.created_at,
          dateModified: row.updated_at || row.published_at || row.created_at,
          mainEntityOfPage: url,
          inLanguage: "ar",
          author: { "@type": "Organization", name: row.publisher_source || SITE_NAME },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/logo.png` },
          },
        },
      };
    }
  }

  m = pathname.match(/^\/events\/([^/?#]+)\/?$/);
  if (m) {
    const row = await fetchOne(
      "events",
      decodeURIComponent(m[1]),
      "id,slug,title,description,cover_image,start_datetime,end_datetime,location,status,organizer_source",
      "&publish_status=eq.published",
    );
    if (row) {
      return {
        title: row.title,
        description: clamp(stripHtml(row.description) || DEFAULT_DESC),
        image: abs(row.cover_image, DEFAULT_IMAGE),
        url,
        type: "article",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Event",
          name: row.title,
          description: stripHtml(row.description) || undefined,
          image: row.cover_image ? [abs(row.cover_image, DEFAULT_IMAGE)] : undefined,
          startDate: row.start_datetime || undefined,
          endDate: row.end_datetime || undefined,
          eventStatus:
            row.status === "cancelled"
              ? "https://schema.org/EventCancelled"
              : "https://schema.org/EventScheduled",
          location: row.location
            ? { "@type": "Place", name: row.location, address: row.location }
            : { "@type": "VirtualLocation", url },
          organizer: {
            "@type": "Organization",
            name: row.organizer_source || SITE_NAME,
            url: SITE_ORIGIN + "/",
          },
          inLanguage: "ar",
        },
      };
    }
  }

  m = pathname.match(/^\/library\/([^/?#]+)\/?$/);
  if (m) {
    const row = await fetchOne(
      "library_items",
      decodeURIComponent(m[1]),
      "id,slug,title,description,cover_image,category,language,published_at,created_at,publisher_source",
      "&status=eq.published",
    );
    if (row) {
      return {
        title: row.title,
        description: clamp(stripHtml(row.description) || DEFAULT_DESC),
        image: abs(row.cover_image, DEFAULT_IMAGE),
        url,
        type: "article",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": /كتب|كتاب|book/i.test(row.category || "") ? "Book" : "CreativeWork",
          name: row.title,
          description: stripHtml(row.description) || undefined,
          image: row.cover_image ? [abs(row.cover_image, DEFAULT_IMAGE)] : undefined,
          inLanguage: row.language || "ar",
          datePublished: row.published_at || row.created_at,
          publisher: { "@type": "Organization", name: row.publisher_source || SITE_NAME },
          genre: row.category || undefined,
          url,
        },
      };
    }
  }

  m = pathname.match(/^\/videos\/([^/?#]+)\/?$/);
  if (m) {
    const row = await fetchOne(
      "videos",
      decodeURIComponent(m[1]),
      "id,slug,title,description,thumbnail,scheduled_at,created_at",
      "&status=eq.published",
    );
    if (row) {
      return {
        title: row.title,
        description: clamp(stripHtml(row.description) || DEFAULT_DESC),
        image: abs(row.thumbnail, DEFAULT_IMAGE),
        url,
        type: "article",
      };
    }
  }

  m = pathname.match(/^\/live\/([^/?#]+)\/?$/);
  if (m) {
    const row = await fetchOne(
      "live_streams",
      decodeURIComponent(m[1]),
      "id,slug,title,description,thumbnail,scheduled_at,status",
    );
    if (row) {
      return {
        title: row.title,
        description: clamp(stripHtml(row.description) || DEFAULT_DESC),
        image: abs(row.thumbnail, DEFAULT_IMAGE),
        url,
        type: "article",
      };
    }
  }

  const PAGE_KEYS: Record<string, { title: string; description: string }> = {
    "/": { title: SITE_NAME, description: DEFAULT_DESC },
    "/about": { title: "من نحن", description: "تعريف باتحاد علماء الأزهر وأهدافه ومجالات عمله." },
    "/vision": { title: "الرؤية والرسالة", description: "ركائز عمل الاتحاد ومبادئه." },
    "/news": { title: "الأخبار والبيانات الرسمية", description: "آخر بيانات الاتحاد ومقالاته وقضاياه المعاصرة." },
    "/events": { title: "فعاليات الاتحاد", description: "مؤتمرات وندوات ودورات ولقاءات علمية ودعوية." },
    "/library": { title: "المكتبة الرقمية", description: "كتب وبحوث وإصدارات اتحاد علماء الأزهر." },
    "/videos": { title: "المرئيات والبث المباشر", description: "محاضرات ولقاءات وبثوث مباشرة." },
    "/research-studies": { title: "البحوث والدراسات", description: "البحوث العلمية والدراسات." },
    "/sharia-academy": { title: "الأكاديمية الشرعية", description: "البرامج الشرعية والأكاديمية." },
    "/civilizational-dialogue": { title: "الحوار الحضاري", description: "مبادرات الحوار بين الأديان والثقافات." },
    "/fatwa-arbitration": { title: "الفتوى والتحكيم", description: "خدمات الفتوى والتحكيم الشرعي." },
    "/partnerships": { title: "الشراكات والتعاون", description: "فرص التعاون والشراكة مع اتحاد علماء الأزهر." },
    "/newsletter": { title: "النشرة البريدية", description: "اشترك في النشرة الدورية." },
    "/contact": { title: "تواصل معنا", description: "قنوات التواصل الرسمية مع الاتحاد." },
    "/privacy": { title: "سياسة الخصوصية", description: "سياسة الخصوصية." },
    "/terms": { title: "الأحكام والشروط", description: "الأحكام والشروط." },
  };
  if (PAGE_KEYS[pathname]) {
    const p = PAGE_KEYS[pathname];
    const keyMap: Record<string, string> = {
      "/about": "about",
      "/vision": "vision",
      "/partnerships": "partnerships",
      "/privacy": "privacy",
      "/terms": "terms",
      "/civilizational-dialogue": "civilizational-dialogue",
    };
    const dpKey = keyMap[pathname];
    if (dpKey) {
      const rows = await sb(
        "dynamic_pages",
        `select=title,seo_title,intro,seo_description,cover_image&page_key=eq.${dpKey}&status=eq.published&limit=1`,
      );
      const dp = rows && rows[0];
      if (dp) {
        return {
          title: dp.seo_title || dp.title || p.title,
          description: clamp(stripHtml(dp.seo_description || dp.intro) || p.description),
          image: abs(dp.cover_image, DEFAULT_IMAGE),
          url,
          type: "website",
        };
      }
    }
    return {
      title: p.title,
      description: clamp(p.description),
      image: DEFAULT_IMAGE,
      url,
      type: "website",
    };
  }

  return null;
}

function buildHead(meta: Meta): string {
  const fullTitle = meta.title.includes(SITE_NAME) ? meta.title : `${meta.title} — ${SITE_NAME}`;
  const t = escAttr(fullTitle);
  const d = escAttr(meta.description);
  const img = escAttr(meta.image);
  const url = escAttr(meta.url);

  const articleTags = meta.type === "article"
    ? `\n    <meta property="article:published_time" content="${escAttr(meta.publishedAt || "")}" />\n    <meta property="article:modified_time" content="${escAttr(meta.modifiedAt || "")}" />`
    : "";

  const jsonLd = meta.jsonLd
    ? `\n    <script type="application/ld+json" data-seo="ssr">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`
    : "";

  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:site_name" content="${escAttr(SITE_NAME)}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:secure_url" content="${img}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="ar_AR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />${articleTags}${jsonLd}
  `.trim();
}

function stripExistingMeta(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "");
}

export const onRequest: PagesFunction = async (ctx) => {
  const req = ctx.request;
  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") || "";

  if (/\.pages\.dev$/i.test(url.hostname)) {
    const target = `${SITE_ORIGIN}${url.pathname}${url.search}`;
    return Response.redirect(target, 301);
  }

  const isCrawler = CRAWLER_RE.test(ua);
  const accept = req.headers.get("accept") || "";
  const wantsHtml = req.method === "GET" && (accept.includes("text/html") || accept === "*/*" || accept === "");

  if (/\.[a-z0-9]{2,5}(?:\?|$)/i.test(url.pathname) && !/\.html?$/i.test(url.pathname)) {
    return ctx.next();
  }

  if (!isCrawler || !wantsHtml) {
    return ctx.next();
  }

  let meta: Meta | null = null;
  try {
    meta = await metaForRoute(url.pathname, req.url);
  } catch {
    meta = null;
  }
  if (!meta) {
    meta = {
      title: SITE_NAME,
      description: DEFAULT_DESC,
      image: DEFAULT_IMAGE,
      url: `${SITE_ORIGIN}${url.pathname}`,
      type: "website",
    };
  }

  let res: Response;
  try {
    res = await ctx.next();
  } catch {
    return ctx.next();
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  let html = await res.text();
  try {
    html = stripExistingMeta(html);
    const head = buildHead(meta);
    html = html.replace(/<head>/i, `<head>\n    ${head}`);
  } catch {
  }

  const headers = new Headers(res.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  headers.set("x-meta-source", "edge-crawler-rewriter");
  return new Response(html, { status: 200, headers });
};
