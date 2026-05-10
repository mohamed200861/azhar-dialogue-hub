# STEP 3 — Sistema Comunicazioni / Email / Notifiche

Implementazione completa, modulare, sicura. Nessuna modifica al design esistente. Nessuna funzione esistente rimossa.

---

## 1. Database (1 migrazione)

### Nuova tabella `notification_events`
Campi: `id, entity_type, entity_id, event_kind, title, summary, url, status (pending/processing/processed/failed/skipped), processed_at, error_message, created_at, updated_at, metadata jsonb`.
- UNIQUE `(entity_type, entity_id, event_kind)` → no duplicati.
- RLS: admin SELECT, service_role ALL, anon nessun accesso.
- Indici: `(status, created_at)`, `(entity_type, entity_id)`, `event_kind`.

### Nuova tabella `email_alert_log` (per anti-spam alert DLQ)
Campi: `id, alert_kind, sent_at`. Indice su `(alert_kind, sent_at)`. Service-role-only.

### Trigger di pubblicazione
Funzione `notify_on_publish()` + trigger AFTER INSERT/UPDATE su:
`news_posts, events, library_items, videos, research_items, academy_programs, dialogue_initiatives`.
Inserisce `notification_event` (kind=`published`) quando lo status passa a `published`. URL costruito per tabella. ON CONFLICT DO NOTHING (idempotente).

### Trigger live streams
Trigger su `live_streams` per status transitions:
- → `live` ⇒ event `live_started`
- → `completed` (con `replay_url`) ⇒ event `live_completed`

### Indici aggiuntivi
`live_streams(status, scheduled_at)`, `live_streams(expires_at) WHERE auto_archive`, `email_send_log(template_name)`, `email_send_log((metadata->>'campaign_id'))`.

---

## 2. Edge Functions

### `process-notification-events` (cron-driven, service-role)
- Legge `pending` con limit batch (es. 20).
- Costruisce email HTML RTL professionale (template arabo) per ogni `event_kind`.
- Recupera iscritti `active` da `newsletter_subscribers` (escludendo `suppressed_emails`).
- Invio via Resend (gateway Lovable se `LOVABLE_API_KEY` disponibile altrimenti diretto). Se `RESEND_API_KEY` manca → marca `failed` con messaggio chiaro, NON crash.
- Append `email_send_log` per ogni invio.
- Aggiorna status `processed`/`failed`. Audit log.

### `live-stream-scheduler` (cron 1 min)
Trova live `scheduled` con `scheduled_at` in `[now, now+15min]`, `notify_subscribers=true`, senza `live_starting` event esistente → crea evento.

### `live-stream-archiver` (cron 5 min)
Trova live con `expires_at < now` e `auto_archive=true` (status non già `archived`) → set status `archived`, `hide_from_homepage=true`, `hide_from_videos=true`. Idempotente.

### `send-form-confirmation` (invocata da client dopo insert)
- Input: `{form_type, record_id}`.
- Carica record (service-role), invia 2 email: conferma al mittente + alert admin a `info@alazharscholarunion.it`.
- Template arabo per ciascun form type.
- Log su `email_send_log`.
- Se Resend non config: salva log `error` ma ritorna 200 (il form non si rompe).

### `daily-email-health-report` (cron 1/giorno)
Conta errori 24h da `email_send_log` + DLQ pgmq se presente. Se errori > 0 e nessun alert oggi (`email_alert_log`), invia summary a `info@alazharscholarunion.it`.

Tutte le funzioni: `verify_jwt = true` lato config, ma controllo interno `service_role` o admin via `getClaims` per quelle invocabili dal client (`send-form-confirmation`).

---

## 3. Frontend

### Nuova pagina `/unsubscribe`
- Legge `?token=...`, chiama edge function `unsubscribe-confirm` (service-role) che valida token, aggiorna subscriber, marca token usato.
- UI RTL, design coerente, messaggio successo o errore.

### `/admin/newsletter` — nuovi tab
Aggiungi accanto agli esistenti (mantieni Iscritti, Campagne):
- **Log email**: tabella ultimi 100 record `email_send_log` con filtro status.
- **Eventi automatici**: tabella `notification_events`, contatori pending/processed/failed, bottone "Riprova falliti" (admin only) → resetta status a pending.
- **Stato servizio**: card con probe RESEND, contatori subscribers, ultime campagne, ultimi errori.

### Form pubblici — invocazione conferma
Dopo insert riuscito su Contact, FatwaArbitration, ResearchStudies, ShariaAcademy, CivilizationalDialogue, NewsletterPublic → fire-and-forget chiamata a `send-form-confirmation`. Non bloccante: errori loggati console, form sempre completa.

---

## 4. Cron / Schedule
Insert via `supabase--insert` (contiene URL+anon key, no migration):
- `process-notification-events` ogni 2 min
- `live-stream-scheduler` ogni 1 min
- `live-stream-archiver` ogni 5 min
- `daily-email-health-report` ogni giorno alle 08:00 UTC

---

## 5. Sicurezza
- Tutte le tabelle nuove: RLS ON, anon nessun accesso, service_role ALL, admin SELECT dove utile.
- `unsubscribe-confirm` è pubblica ma valida solo token; non espone email.
- Nessun secret nel frontend.
- Anti-doppio-invio: UNIQUE constraint + check `email_send_log` su `(template_name, recipient_email, metadata->>'event_id')`.

---

## 6. Documentazione
Crea `EMAIL_SYSTEM.md` con: indirizzi email del sito, mappa tabelle, flusso notification events, flusso live, flusso form, cron list, troubleshooting, come configurare RESEND_API_KEY.

---

## File creati / modificati

**Migrazione SQL** (1): tabella `notification_events`, `email_alert_log`, funzioni trigger, indici.

**Edge functions nuove** (5):
- `supabase/functions/process-notification-events/{index.ts,deno.json}`
- `supabase/functions/live-stream-scheduler/{index.ts,deno.json}`
- `supabase/functions/live-stream-archiver/{index.ts,deno.json}`
- `supabase/functions/send-form-confirmation/{index.ts,deno.json}`
- `supabase/functions/daily-email-health-report/{index.ts,deno.json}`
- `supabase/functions/unsubscribe-confirm/{index.ts,deno.json}`

**Frontend nuovo**:
- `src/pages/Unsubscribe.tsx` (+ route in `App.tsx`)
- nuovi tab in `src/pages/admin/Newsletter.tsx`

**Frontend toccato leggermente** (chiamata fire-and-forget `send-form-confirmation`):
- `src/pages/Contact.tsx`, `FatwaArbitration.tsx`, `ResearchStudies.tsx`, `ShariaAcademy.tsx`, `CivilizationalDialogue.tsx`, `NewsletterPublic.tsx`

**Config** `supabase/config.toml`: registrazione nuove funzioni.

**Docs**: `EMAIL_SYSTEM.md`.

**Cron**: insert SQL via `supabase--insert`.

---

## Note importanti
- Non promette zero manutenzione: la doc indica controlli mensili.
- Senza `RESEND_API_KEY` il sistema continua a funzionare: gli eventi restano `failed` con errore chiaro, i form si salvano comunque.
- Tutto idempotente: nessun rischio doppi invii.
- Il design admin esistente NON viene modificato — solo aggiunti tab.

Procedo all'implementazione una volta approvato il piano.