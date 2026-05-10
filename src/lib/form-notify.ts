// Fire-and-forget helper for triggering confirmation + admin alert emails
// after a public form submission. Never throws; never blocks the form UX.
import { supabase } from "@/integrations/supabase/client";

export type FormType = "contact" | "fatwa" | "academy" | "dialogue" | "research" | "newsletter";

export function fireFormConfirmation(form_type: FormType, record_id: string | undefined | null) {
  if (!record_id) return;
  // intentionally not awaited
  void supabase.functions.invoke("send-form-confirmation", { body: { form_type, record_id } })
    .catch((e) => { console.warn("[form-confirmation] failed", e); });
}
