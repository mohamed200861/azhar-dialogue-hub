import { useEffect, useRef } from "react";

/** Google AdSense Multiplex ("autorelaxed") unit. Loader script lives in index.html. */
export function MultiplexAd() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* script not ready */
    }
  }, []);

  return (
    <div className="w-full" aria-hidden="true">
      <div className="container-wide py-6">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-format="autorelaxed"
          data-ad-client="ca-pub-6841143407078696"
          data-ad-slot="4930634647"
        />
      </div>
    </div>
  );
}
