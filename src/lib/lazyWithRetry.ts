import { lazy, type ComponentType } from "react";

/**
 * React.lazy wrapper that retries failed dynamic imports.
 *
 * Why: after a new deploy, the user's currently-loaded index.html still
 * references the OLD hashed chunk filenames. When they navigate to a lazy
 * route, the browser tries to fetch a chunk that no longer exists on the
 * CDN → "Failed to fetch dynamically imported module" / blank page.
 *
 * Strategy:
 *  1. Retry the import up to N times with a short backoff (handles transient
 *     network/CDN propagation issues).
 *  2. If it still fails AND the page hasn't been auto-reloaded yet during
 *     this session, force a full reload — this fetches a fresh index.html
 *     with the new chunk hashes.
 */
const RELOAD_FLAG = "__chunk_reload_attempted__";

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  delayMs = 400,
) {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        }
      }
    }

    // All retries exhausted. If this is the first failure this session,
    // hard-reload to pick up the new index.html. Otherwise propagate so the
    // error boundary can render a friendly fallback (prevents reload loops).
    try {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === "1";
      if (!alreadyReloaded && typeof window !== "undefined") {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        // Return a never-resolving promise while the reload happens.
        return new Promise(() => {}) as Promise<{ default: T }>;
      }
    } catch {
      /* sessionStorage may be unavailable */
    }
    throw lastError;
  });
}
