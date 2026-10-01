import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Google AdSense responsive "auto" unit (slot "elazhar").
 * - Full-width responsive: the container must keep the full available width
 *   (no max-width narrower than the page column) per AdSense requirements.
 * - The loader script lives once in index.html <head>; we only push the slot.
 * - Guarded against double-push (React StrictMode remounts effects in dev).
 */
export function ResponsiveAd() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense script not loaded yet — safe to ignore */
    }
  }, []);

  return (
    <div className="w-full border-t border-border/40 bg-background" aria-hidden="true">
      <div className="container-wide py-6">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-6841143407078696"
          data-ad-slot="4565594174"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
