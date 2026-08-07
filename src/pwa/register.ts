/**
 * Production-safe PWA registration wrapper.
 *
 * This module is the ONLY registrar of the service worker.
 * vite-plugin-pwa is configured with `injectRegister: null` to ensure that.
 *
 * It refuses to register the SW in any non-production context (dev,
 * Lovable preview, iframe, ?sw=off). In those contexts it actively
 * unregisters any leftover SW and clears its caches — replacing the
 * legacy inline cleanup script that used to live in index.html.
 */

const SW_URL = "/sw.js";

function isLovablePreviewHost(host: string): boolean {
  return (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.top !== window.self) return true;
  } catch {
    return true;
  }
  if (isLovablePreviewHost(window.location.hostname)) return true;
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") {
    return true;
  }
  return false;
}

async function unregisterAndClean(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        regs
          .filter((r) => {
            try {
              const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
              return url.endsWith(SW_URL) || url.includes("/sw.js");
            } catch {
              return true;
            }
          })
          .map((r) => r.unregister()),
      );
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      // Only delete workbox-style caches; leave any third-party caches alone.
      const workboxKeys = keys.filter((k) =>
        /(^|-)workbox-|(^|-)precache-v\d+-|(^|-)runtime-/.test(k),
      );
      await Promise.allSettled(workboxKeys.map((k) => caches.delete(k)));
    }
  } catch {
    /* no-op */
  }
}

let registered = false;

/**
 * Older deploys used a NetworkFirst "html-pages" cache together with an
 * offline.html navigation fallback. Entries in it can still serve stale
 * (or offline) HTML to returning users, so drop it once on startup.
 */
async function dropLegacyHtmlCache(): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    await caches.delete("html-pages");
  } catch {
    /* no-op */
  }
}

export function registerPWA(): void {
  if (registered) return;
  registered = true;

  void dropLegacyHtmlCache();

  if (isRefusedContext()) {
    // Clean up any stale SW left from previous deploys / earlier visits.
    void unregisterAndClean();
    return;
  }

  if (!("serviceWorker" in navigator)) return;


  // Dynamic import so the workbox-window code is not in the main chunk.
  void import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          // autoUpdate is on; trigger refresh after a short grace period
          // so any in-flight user action can complete.
          setTimeout(() => {
            try {
              updateSW(true);
            } catch {
              window.location.reload();
            }
          }, 5000);
        },
        onRegisterError(err) {
          // Silent — never block the app on SW errors.
          console.warn("[pwa] registration failed", err);
        },
      });
    })
    .catch((err) => {
      console.warn("[pwa] virtual:pwa-register import failed", err);
    });
}
