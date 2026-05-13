import { useEffect, useRef, useState } from "react";

/**
 * Local-draft autosave for admin forms.
 *
 * - Persists `value` to localStorage under `admin-draft:{key}` (debounced).
 * - On first mount, if a draft exists that differs from the loaded value,
 *   asks the user whether to restore it. If yes, calls `setValue(draft)`.
 * - Tracks dirty state vs the last persisted/saved snapshot.
 * - Installs a `beforeunload` guard while there are unsaved changes so the
 *   browser warns before close/refresh. (In-app route changes can't be
 *   blocked under <BrowserRouter>; the autosave + restore flow covers
 *   those cases — switching tab/route and coming back restores the draft.)
 *
 * Usage:
 *   const draft = useFormDraft({
 *     key: `news:${id ?? "new"}`,
 *     ready: !loading,             // only start tracking once the form is loaded
 *     value: form,
 *     setValue: setForm,
 *   });
 *   // After a successful server save:
 *   draft.markSaved(form);
 *
 *   // Render <DraftStatus state={draft.state} /> for UI feedback.
 */

export type DraftState = "idle" | "dirty" | "local-saved" | "saved";

type Options<T> = {
  key: string;
  ready: boolean;
  value: T;
  setValue: (next: T) => void;
  /** Skip restoring a draft if it equals this value (e.g. an empty form). */
  isEmpty?: (v: T) => boolean;
  debounceMs?: number;
};

const PREFIX = "admin-draft:";
const META_PREFIX = "admin-draft-meta:";

function readDraft<T>(key: string): { value: T; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    const meta = localStorage.getItem(META_PREFIX + key);
    if (!raw) return null;
    return { value: JSON.parse(raw) as T, savedAt: meta ? Number(meta) : 0 };
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    localStorage.setItem(META_PREFIX + key, String(Date.now()));
  } catch {
    /* quota or serialization error — ignore */
  }
}

function dropDraft(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
    localStorage.removeItem(META_PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function useFormDraft<T>({
  key,
  ready,
  value,
  setValue,
  isEmpty,
  debounceMs = 700,
}: Options<T>) {
  const [state, setState] = useState<DraftState>("idle");
  const baselineRef = useRef<string>("");
  const restoredRef = useRef(false);
  const lastWrittenRef = useRef<string>("");

  // 1) Initial-load: capture baseline + offer to restore an existing draft.
  useEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;
    baselineRef.current = JSON.stringify(value ?? null);
    lastWrittenRef.current = baselineRef.current;

    const draft = readDraft<T>(key);
    if (!draft) {
      setState("saved");
      return;
    }
    const draftJson = JSON.stringify(draft.value ?? null);
    if (draftJson === baselineRef.current) {
      // Nothing different — drop the stale entry silently.
      dropDraft(key);
      setState("saved");
      return;
    }
    if (isEmpty && isEmpty(draft.value)) {
      dropDraft(key);
      setState("saved");
      return;
    }
    const ok = window.confirm(
      "تم العثور على مسودة غير محفوظة على هذا الجهاز. هل تريد استردادها؟\n\nاضغط (موافق) للاسترداد أو (إلغاء) لتجاهلها.",
    );
    if (ok) {
      setValue(draft.value);
      setState("local-saved");
    } else {
      dropDraft(key);
      setState("saved");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  // 2) Debounced persist on every change after the form is ready.
  useEffect(() => {
    if (!ready || !restoredRef.current) return;
    const json = JSON.stringify(value ?? null);
    if (json === lastWrittenRef.current) return;
    if (json === baselineRef.current) {
      // Reverted back to clean — drop draft.
      dropDraft(key);
      lastWrittenRef.current = json;
      setState("saved");
      return;
    }
    setState("dirty");
    const t = window.setTimeout(() => {
      writeDraft(key, value);
      lastWrittenRef.current = json;
      setState("local-saved");
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [value, ready, key, debounceMs]);

  // 3) Warn before close/refresh while dirty.
  useEffect(() => {
    if (state !== "dirty" && state !== "local-saved") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state]);

  /** Call this after a successful server-side save. */
  const markSaved = (savedValue?: T) => {
    const v = savedValue ?? value;
    baselineRef.current = JSON.stringify(v ?? null);
    lastWrittenRef.current = baselineRef.current;
    dropDraft(key);
    setState("saved");
  };

  /** Drop the local draft without touching the server. */
  const clearDraft = () => {
    dropDraft(key);
    baselineRef.current = JSON.stringify(value ?? null);
    lastWrittenRef.current = baselineRef.current;
    setState("saved");
  };

  return { state, markSaved, clearDraft };
}
