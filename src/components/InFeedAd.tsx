import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Google AdSense In-feed unit.
 * - Fluid format: Google sizes it automatically, so the container must stay
 *   auto-height (no fixed height) per AdSense policy.
 * - The script tag lives in index.html <head>; we only push the slot here.
 * - Guarded against double-push (React StrictMode remounts effects in dev).
 */
export function InFeedAd() {
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
    <div className="w-full overflow-hidden" aria-hidden="true">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="fluid"
        data-ad-layout-key="-g1+2+s-57+8q"
        data-ad-client="ca-pub-6841143407078696"
        data-ad-slot="1072323296"
      />
    </div>
  );
}
