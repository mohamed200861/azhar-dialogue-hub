# Sistema Email & Notifiche

## Indirizzi email
- `alazharscholarunion@gmail.com` → email pubblica del sito (mostrata nelle pagine).
- `info@alazharscholarunion.it` → notifiche admin / alert errori.
- `newsletter@alazharscholarunion.it` → mittente newsletter e notifiche automatiche.

## Tabelle
- `notification_events` → hub eventi (UNIQUE su entity_type+entity_id+event_kind, no doppi invii).
- `email_send_log` → log invii (success / error).
- `email_alert_log` → anti-spam alert giornalieri.
- `newsletter_subscribers` → iscritti.
- `email_unsubscribe_tokens` → token unsubscribe.

## Trigger DB
- `notify_on_publish()`: news_posts, events, library_items, videos, research_items, academy_programs, dialogue_initiatives → crea event `published` quando passa a `published`.
- `notify_on_live_change()`: live_streams → eventi `live_started` e `live_completed`.

## Edge Functions
| Nome | Scopo | Trigger |
|------|-------|---------|
| `process-notification-events` | Manda email per gli eventi pending agli iscritti attivi | cron 2 min (service-role only) |
| `live-stream-scheduler` | Crea evento `live_starting` 15min prima | cron 1 min (service-role only) |
| `live-stream-archiver` | Nasconde live scadute (auto_archive) | cron 5 min (service-role only) |
| `send-form-confirmation` | Conferma utente + alert admin dopo form pubblico | invocata dal client (public) |
| `daily-email-health-report` | Report giornaliero errori email | cron 1/giorno |
| `unsubscribe-confirm` | Endpoint per pagina /unsubscribe | invocata dal client (public) |

## Senza RESEND_API_KEY
- Eventi restano `failed` con messaggio chiaro nel log.
- Form pubblici si salvano ugualmente nel database (l'invio email è fire-and-forget).
- Niente crash, niente blocchi UI.

## Configurare Resend
1. `https://resend.com` → crea API key.
2. Aggiungi secret `RESEND_API_KEY` da Lovable Cloud.
3. Configura dominio `mail.alazharscholarunion.it` su Resend con DNS (SPF, DKIM, DMARC).
4. Tornare in `/admin/newsletter` → la card "Stato servizio" diventa verde.

## Cron (da configurare manualmente)
SQL da eseguire una volta tramite tool insert (richiede pg_cron + pg_net + service_role_key):
```sql
select cron.schedule('process-notification-events','*/2 * * * *',$$
  select net.http_post(
    url:='https://jqyioadvwldtiszmpmlt.supabase.co/functions/v1/process-notification-events',
    headers:=jsonb_build_object('Authorization','Bearer ' || current_setting('app.service_role_key', true))
  )$$);
-- analogo per live-stream-scheduler (* * * * *), live-stream-archiver (*/5 * * * *), daily-email-health-report (0 8 * * *)
```
In alternativa usa scheduler esterno (cron-job.org) chiamando l'URL function con header `Authorization: Bearer <SERVICE_ROLE_KEY>`.

## Verifica errori
- Admin → `/admin/newsletter` → tab **سجل الإرسال** (sent log) e **الأحداث التلقائية** (events).
- Bottone "Riprova falliti" rimette gli eventi in pending.

## Manutenzione mensile
- Controllare contatori errori 24h, eventi pending, DLQ.
- Rinnovo eventuali token Resend o quote API.
- Rivedere subscribers unsubscribed.
