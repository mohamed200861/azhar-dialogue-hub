
# Production-Safe PWA Integration

Goal: real installable PWA with automatic updates and offline fallback, without re-introducing the stale-cache bug the cleanup script was originally added to fix, and without registering a service worker inside Lovable preview / dev iframes.

---

## 1. Coordinated removal of the old SW-cleanup script

**Current state:** `index.html` ships an inline script that calls `navigator.serviceWorker.getRegistrations().then(r => r.unregister())` on every page load and wipes `caches`. This was added after a prior broken-PWA incident.

**Safe migration:**
- Remove the inline cleanup script from `index.html`.
- Replace it with the guarded registration wrapper (see step 3). The wrapper itself **unregisters** any existing SW when running in dev/preview/iframe contexts, so the cleanup behavior is preserved exactly where it mattered (Lovable preview iframes).
- In production, the new SW will register cleanly. Returning users still on the OLD `index.html` will be served fresh HTML on next navigation (HTML is already `must-revalidate` in `public/_headers`), at which point the new wrapper takes over.
- No reload loops: registration happens once per page load, behind a one-shot guard.

Rollback safety: if the new SW ever misbehaves, replace `public/sw.js`'s generated content with a kill-switch worker (precedent already in the PWA skill) and ship — returning browsers will self-unregister within one visit.

---

## 2. Install and configure `vite-plugin-pwa`

Add `vite-plugin-pwa` as a dev dependency and configure it in `vite.config.ts` with **generateSW** (Workbox under the hood):

- `registerType: "autoUpdate"` — new SW takes over without a user prompt.
- `injectRegister: null` — plugin must NOT auto-inject registration; our wrapper is the single registrar.
- `devOptions: { enabled: false }` — never emit an SW in dev.
- `manifest: false` — keep our existing `public/manifest.webmanifest` (already correct).
- `workbox`:
  - `cleanupOutdatedCaches: true`
  - `skipWaiting: true`, `clientsClaim: true`
  - `navigateFallback: "/offline.html"` (excluding `/admin`, `/~oauth`, API paths via `navigateFallbackDenylist`)
  - `globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"]`
  - `runtimeCaching`:
    - **HTML navigations** → `NetworkFirst` (3s timeout), never cache-first.
    - **Hashed `/assets/*`** → `CacheFirst`, 1y, immutable.
    - **Google Fonts CSS/files** → `StaleWhileRevalidate`.
    - **Supabase storage images** (`*.supabase.co/storage/v1/...`) → `StaleWhileRevalidate`, cap 60 entries / 30d.
    - **Supabase REST `/rest/v1/`** → `NetworkOnly` (do NOT cache).
    - **Supabase Auth `/auth/v1/`** → `NetworkOnly` (do NOT cache).
    - **Edge functions `/functions/v1/`** → `NetworkOnly`.
    - **Admin routes & mutations** → `NetworkOnly`.

The plugin will emit `/sw.js` and `/registerSW.js` (the latter we ignore).

---

## 3. Guarded registration wrapper

New file `src/pwa/register.ts`. Refuses to register when **any** of these are true:
- `!import.meta.env.PROD`
- The app is inside an iframe (`window.top !== window.self`)
- Hostname matches Lovable preview/dev: starts with `id-preview--` or `preview--`; equals or ends with `.lovableproject.com`, `.lovableproject-dev.com`, `.beta.lovable.dev`
- URL has `?sw=off` (kill switch)

In any refused context, it actively **unregisters** existing `/sw.js` and clears Workbox caches — replacing the old inline cleanup.

In production, it imports `virtual:pwa-register` lazily and registers with `immediate: true`. An `onNeedRefresh` callback fires when a new SW is waiting; we trigger `updateSW(true)` automatically after a 5s grace period (autoUpdate behavior), and also show a small non-blocking toast `"تم تحديث الموقع. سيتم إعادة التحميل."` via Sonner so the user isn't surprised.

`src/main.tsx` calls `registerPWA()` after `createRoot(...).render(...)` — never before, so registration cannot delay first paint.

---

## 4. Offline fallback page

New `public/offline.html` — self-contained (inline CSS, no JS, no app imports). RTL, branded with logo, message in Arabic: "أنت غير متصل بالإنترنت — تحقق من اتصالك وحاول مجددًا" + a "إعادة المحاولة" button that calls `location.reload()`. Reused by Workbox's `navigateFallback` for any failed navigation while offline.

---

## 5. Cache headers update

Update `public/_headers`:
- `/sw.js` → `Cache-Control: public, max-age=0, must-revalidate` (critical — must never be cached, or updates can't propagate).
- `/manifest.webmanifest` → `Cache-Control: public, max-age=3600, must-revalidate`.
- `/offline.html` → `Cache-Control: public, max-age=0, must-revalidate`.
- Hashed `/assets/*` rule already correct (1y immutable).

---

## 6. Manifest + icon polish

Existing `public/manifest.webmanifest` is mostly correct. Small adjustments:
- Add a dedicated 192×192 icon entry with `purpose: "any"` and a 512×512 with `purpose: "maskable"`. Since current `logo.png` may not have the required safe-zone padding, I will generate a maskable variant by compositing the logo on a `#367A2E` background with proper padding (saved as `public/icon-maskable-512.png`).
- Add Apple splash hints via additional `<link rel="apple-touch-startup-image">` for common iPhone sizes is optional and **out of scope** here (each requires a pre-rendered PNG per device — heavy and low ROI). I'll skip unless requested.
- Existing `apple-touch-icon.png` already covers iOS home-screen icon.

---

## 7. Files touched

Modified:
- `index.html` — remove SW-cleanup `<script>`.
- `vite.config.ts` — add `VitePWA(...)` plugin.
- `src/main.tsx` — call `registerPWA()` post-render.
- `public/_headers` — `/sw.js`, `/manifest.webmanifest`, `/offline.html` rules.
- `public/manifest.webmanifest` — icon entries refined.
- `package.json` — add `vite-plugin-pwa` to devDependencies.

Created:
- `src/pwa/register.ts` — guarded registration + unregistration wrapper.
- `public/offline.html` — offline fallback.
- `public/icon-maskable-512.png` — maskable icon (generated from logo).

---

## 8. Verification checklist (executed after build mode flips)

- Build succeeds; `dist/sw.js` and `dist/manifest.webmanifest` present.
- `sw.js` does NOT precache anything under `/admin` or `/functions/v1`.
- Preview URL (`id-preview--*.lovable.app`) does NOT register an SW (wrapper guard).
- Production navigation while offline serves `/offline.html`.
- `?sw=off` unregisters the SW.
- No regression to `lazyWithRetry` / `RouteErrorBoundary` (still wired in `App.tsx`).
- No new entries to `index.html` that would break the existing OG-meta middleware in `functions/_middleware.ts`.

---

## Architecture summary

```
Browser
   ├── index.html (must-revalidate, no inline SW logic)
   ├── /sw.js  (Workbox, must-revalidate)
   │      ├── precache: hashed /assets/* (immutable)
   │      ├── NetworkFirst:  HTML navigations  → /offline.html fallback
   │      ├── CacheFirst:    /assets/*  (1y)
   │      ├── SWR:           Google Fonts, Supabase storage images
   │      └── NetworkOnly:   /rest/v1, /auth/v1, /functions/v1, /admin
   └── src/pwa/register.ts  (single registrar; unregisters in dev/preview/iframe/?sw=off)
```

## Update flow

1. Deploy ships new hashed assets + new `/sw.js`.
2. Returning user loads `index.html` (revalidated → fresh).
3. New `/sw.js` installs in background; `skipWaiting` + `clientsClaim` activate it.
4. `onNeedRefresh` fires → after 5s grace + toast, page auto-reloads with new chunks.
5. If user navigates to a removed lazy chunk before the reload, `lazyWithRetry` (already in place) catches it and forces the same reload.

## Rollback safety

If a future deploy introduces a bad SW, replace the generated `sw.js` content with the standard kill-switch worker (origin-scoped cache cleanup + `self.registration.unregister()` in `finally`). All returning browsers self-heal in one visit. No user action required.

## Out of scope

- TanStack Start / SSR — not used in this project (Vite SPA + Cloudflare Pages Functions for OG meta only).
- Push notifications — separate worker file & integration; not requested here.
- Pre-rendered iOS splash screens — heavy, low ROI; can be added on request.
