import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

const DISMISS_KEY = "asu-install-dismissed-at";
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function recentlyDismissed(): boolean {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    return Date.now() - Number(v) < DISMISS_DAYS * 86400_000;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Non-invasive install prompt:
 *  - Android/Chrome: uses native `beforeinstallprompt`.
 *  - iOS Safari: shows "Add to Home Screen" instructions (no native API).
 *  - Hidden if already installed, dismissed recently, or on desktop.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS fallback — only on small screens
    if (isIOS() && window.innerWidth < 768) {
      setTimeout(() => {
        if (!isStandalone() && !recentlyDismissed()) {
          setIosHint(true);
          setShow(true);
        }
      }, 6000);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* no-op */ }
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
    setDeferred(null);
  };

  if (!show) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 inset-x-4 z-[60] md:hidden animate-in slide-in-from-bottom-4"
    >
      <div className="card-elegant p-4 flex items-start gap-3 bg-card/95 backdrop-blur border-primary/20">
        <img src="/favicon.png" alt="" className="w-10 h-10 rounded-lg shrink-0" width={40} height={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">ثبّت تطبيق اتحاد علماء الأزهر</p>
          {iosHint ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              اضغط <Share className="inline w-3 h-3" /> ثم "إضافة إلى الشاشة الرئيسية".
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              وصول أسرع وتجربة كأنه تطبيق.
            </p>
          )}
          {!iosHint && deferred && (
            <Button size="sm" className="mt-2 h-8" onClick={install}>
              <Download className="w-3.5 h-3.5 ml-1" />
              تثبيت
            </Button>
          )}
        </div>
        <button
          aria-label="إغلاق"
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground p-1 -mr-1 -mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
