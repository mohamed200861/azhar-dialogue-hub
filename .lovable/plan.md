# Final Stabilization Plan

Scope: only the four issues. No redesign, no schema changes, no touching memberships/Quran/Khutbah/Fatwa/Admin/SEO/routing/translations beyond what the fixes require.

---

## Issue 1 — Homepage featured image reliability

**Root cause (confirmed by reading `Home.tsx` + `PublicationCard.tsx` + `SmartImage.tsx`):**

1. The "featured image" on the homepage is rendered by `SmartImage` inside `PublicationCard`. `SmartImage` only has a single `onError` → fallback path. No retry, no timeout, no transient-failure recovery.
2. Sources come from Supabase Storage public URLs. Public URLs occasionally return `0`/`5xx` on cold CDN edges or during a brief network blip → image becomes the gray fallback even though the file exists.
3. The card image is `loading="lazy"` for *every* card, including the first (LCP candidate above the fold on mobile). Lazy + slow first byte can race with viewport intersection and produce a long blank state.
4. There is no preload for the actual LCP image — only `/logo.png` is preloaded in `index.html`.
5. No `<noscript>` fallback, no decoding hint optimization, no width/height → CLS plus error obscurity.

**Fix (frontend only, no schema change):**

- Extend `SmartImage` with:
  - One automatic retry on error (append `?v=2` cache-bust) before showing fallback.
  - Optional `eager` priority prop (`fetchPriority="high"`, `loading="eager"`, `decoding="sync"`) for the first card / hero candidate.
  - `width`/`height` props forwarded so CLS is zero.
  - Lightweight console diagnostic gated by `import.meta.env.DEV` only (no prod log spam).
- In `LatestPublications`, mark the first card on mobile and the first 2 on desktop as priority.
- Add a new helper `src/lib/supabase-image.ts` that, given a Supabase public storage URL, returns a transformed URL using Supabase's image transform endpoint (`/storage/v1/render/image/public/...`) with `width` + `quality=70` + `format=auto` (webp/avif). Falls through unchanged for non-Supabase URLs.
- Use the helper in `PublicationCard` to request a 600px-wide thumbnail instead of the original.
- Keep the existing `SmartImage` fallback icon path so we never render an empty container.

This resolves both the "random failure" and a large chunk of Issue 4 (image weight).

---

## Issue 2 — PWA install prompt

Current `InstallPrompt` only shows on `md:hidden` and only on the home page (it's mounted globally? — confirm in build step). The user wants it visible on all major public pages, with a manual install button on Android and iOS instructions automatically.

**Fix:**

- Mount `<InstallPrompt />` inside `SiteLayout` (it currently lives in `App.tsx` per earlier context — verify and consolidate so every public page gets it; Admin pages already use `AdminLayout` and are excluded).
- Remove `md:hidden` so tablets also see the card; keep the dismissed-for-14-days behavior.
- Add a small persistent "تثبيت التطبيق" button in the `Footer` (always available, no auto-show) that:
  - On Android: calls the captured `deferredPrompt` if present; otherwise opens a modal with browser-specific instructions.
  - On iOS Safari: opens the same instructions modal (Share → Add to Home Screen).
- Detection helpers stay in `InstallPrompt.tsx`; export a `useInstallPrompt()` hook so both the banner and the footer button share state.
- Skip everything when `display-mode: standalone` is true.

---

## Issue 3 — Site audit (report only, no speculative rewrites)

I will run targeted checks and produce a real report:

- `tsc --noEmit` via the harness build (already automatic).
- Browser performance profile on `/` mobile viewport (375×812) and desktop (1440×900).
- `browser--read_console_logs` + `browser--list_network_requests` on `/`, `/news`, `/library`, `/videos`, `/events`, `/khutbahs`, `/quran`.
- Security headers check against `public/_headers` and `functions/_middleware.ts` (CSP / HSTS / XFO / COOP / Referrer-Policy).
- `supabase--linter` for RLS/permission warnings.

The report will list real findings only, separated into critical / medium / low, with recommended follow-ups. No silent edits to unrelated systems.

---

## Issue 4 — PageSpeed mobile

Concrete fixes (all bundled with the work above, no design change):

1. **Images** — Supabase image transform helper from Issue 1 → ~80% byte savings on every card. Add `sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 25vw"` to `PublicationCard` images.
2. **LCP** — preload the first publication image once it's known (inject a `<link rel="preload" as="image">` from `LatestPublications` for the top item on mobile). Hero already has `eager` logo preload.
3. **Render-blocking fonts** — switch the Google Fonts `<link>` in `index.html` to `media="print" onload="this.media='all'"` pattern with a `<noscript>` fallback so fonts stop blocking FCP.
4. **JS** — confirm existing `manualChunks` in `vite.config.ts` is taking effect; no new bundler changes unless build report shows a regression.
5. **CSS** — no Tailwind changes; verify `content` globs are tight (read `tailwind.config.ts` during build phase).
6. **Headers** — already strong in `public/_headers`; verify hashed `/assets/*` `immutable` rule is hit by build output.

Targets: LCP < 2.5s, FCP < 2s, homepage payload < 3 MB on mobile. Will report actual measured numbers after the fix, not claimed numbers.

---

## Files to modify

- `src/components/SmartImage.tsx` — retry, priority, dimensions.
- `src/lib/supabase-image.ts` — new, transform helper.
- `src/components/home/PublicationCard.tsx` — use helper, `sizes`, priority for first card.
- `src/components/home/LatestPublications.tsx` — preload first item, pass priority.
- `src/components/InstallPrompt.tsx` — remove `md:hidden`, export hook.
- `src/components/Footer.tsx` — add manual install button + instructions modal.
- `src/components/SiteLayout.tsx` — ensure `InstallPrompt` is mounted here (if not already from App).
- `index.html` — non-blocking Google Fonts load.

## Out of scope (will not touch)

Routing, Supabase schema/RLS, admin permissions, memberships, Quran, Khutbah, Fatwa, Library, News business logic, translations, SEO meta, OG, sitemap, service-worker registration logic (already correct).

## Verification

- Harness build + typecheck.
- `browser--view_preview` at mobile and desktop, check console + network.
- `browser--performance_profile` before/after on `/`.
- Hard-reload several times to confirm featured image never falls back unless the URL is genuinely broken.

## Final report will include

1. Exact files modified.
2. Root cause for the image flakiness.
3. Fixes actually applied.
4. Measured before/after FCP, LCP, payload (from `performance_profile`).
5. Any remaining limitations.
