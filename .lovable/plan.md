## Goal
Make every shared link show a clean preview (title, description, image) across WhatsApp, Facebook, Telegram, X/Twitter, LinkedIn — without touching auth, RLS, admin, routing, schema, or business logic. Only edit head-meta defaults, the `applySeo` helper, and the few detail pages that don't currently pass a cover image.

## What's already in place (no changes)
- `src/lib/seo.ts` already emits `og:*`, `twitter:card=summary_large_image`, canonical, JSON-LD, with absolute URLs forced to `https://alazharscholarunion.it`.
- `index.html` already ships static OG/Twitter tags + Organization/WebSite JSON-LD as the non-JS fallback.
- `NewsDetail`, `LibraryDetail` (books), `EventDetail`, `VideoDetail`, `LiveDetail`, `FatwaArbitration` already pass real `title` / `description` / `image` to `applySeo`.

## Changes

### 1. Homepage OG (static, in `index.html`)
- Replace static `<title>` and `og:title` / `twitter:title` so the homepage preview reads exactly:
  - title: `اتحاد علماء الأزهر`
  - description: `الموقع الرسمي لاتحاد علماء الأزهر`
- Switch homepage `og:image` / `twitter:image` to `/og-home.jpg` (1200x630). If the file is missing keep `/og-image.png` as the existing fallback already declared.
- Keep all other head tags (canonical, JSON-LD, locale, sizes) unchanged.

### 2. Generate `/public/og-home.jpg` (1200x630)
- Use the imagegen tool to produce a professional hero (mosque silhouette + brand green `#367A2E`, Arabic wordmark "اتحاد علماء الأزهر", subtitle "الموقع الرسمي"). Save to `public/og-home.jpg`. This is a static asset — no code logic touched.

### 3. `src/lib/seo.ts` — small hardening only
- Add explicit `og:image:width=1200`, `og:image:height=630`, `og:image:type` meta when an image is set, so WhatsApp/Telegram render the large card reliably.
- Add `og:image:alt` = title.
- Default `og:image` already falls back to `/og-image.png` when a page passes none — leave as-is. No signature change, no breaking edits.

### 4. Detail pages currently missing cover image in `applySeo`
Only two pages skip the image arg today. Add it without touching layout or queries:
- `src/pages/KhutbahDetail.tsx` — pass `image: k.featured_image`, `type: "article"`, `url`, plus a minimal `CreativeWork` JSON-LD with `headline`, `image`, `datePublished`.
- `src/pages/QuranDetail.tsx` — pass `image: lesson.cover_image ?? lesson.thumbnail ?? undefined`, `type: "article"`, `url`, minimal JSON-LD. (Use whichever image column already exists; verify at edit time, no schema change.)

### 5. Fallback chain inside `applySeo` (single place)
Already: per-page image → `/og-image.png`. Keep that, just make sure absolute-URL resolution stays correct (already implemented). No new fallback code paths needed beyond what's there.

## What this will and will not fix (honest limitations)
- **Will fix:** Homepage preview (title, description, dedicated image). Detail pages whose preview is fetched by a crawler that **executes JavaScript** (Googlebot, modern LinkedIn Post Inspector after JS, Slackbot in some modes).
- **Will not fix without SSR:** WhatsApp, Telegram, Facebook, X, classic LinkedIn crawlers do **not** execute JS. They only see `index.html`. So for `/news/:slug`, `/library/:slug`, etc., they'll keep showing the homepage OG image and title regardless of `applySeo`. The only way to give every detail URL its own real preview to those crawlers is server-side rendering of `<meta>` tags (edge function / prerender). That is out of scope per the user's constraints (no backend / SSR changes) and will be called out as a remaining limitation in the final report.

## Files touched
- `index.html` (homepage OG title/desc/image)
- `public/og-home.jpg` (new asset)
- `src/lib/seo.ts` (add og:image:width/height/type/alt)
- `src/pages/KhutbahDetail.tsx` (pass image + url + jsonLd)
- `src/pages/QuranDetail.tsx` (pass image + url + jsonLd)

Nothing else.

## Verification
- Build + typecheck.
- Inspect generated `<head>` on `/`, `/khutbahs/:slug`, `/quran/:slug` in the preview to confirm OG tags carry real values.
- Note to user: re-scrape via Facebook Sharing Debugger / Twitter Card Validator / WhatsApp (forward to "Note to self") to bust their cache.
