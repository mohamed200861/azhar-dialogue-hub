import { CheckCircle2, CloudOff, Loader2, Save } from "lucide-react";
import type { DraftState } from "@/hooks/useFormDraft";

export function DraftStatus({ state }: { state: DraftState }) {
  if (state === "idle") return null;
  if (state === "dirty") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        جارٍ حفظ المسودة محليًا…
      </span>
    );
  }
  if (state === "local-saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Save className="h-3.5 w-3.5" />
        مسودة محفوظة محليًا
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      محفوظ
    </span>
  );
}

// Re-export to keep imports tidy at call sites.
export { CloudOff };
