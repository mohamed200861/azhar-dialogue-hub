# Maintenance Guide — Al-Azhar Scholars Union

Guida operativa per la manutenzione del sito nel tempo.
Obiettivo: ridurre al minimo i problemi tecnici, non eliminarli del tutto.

---

## Architettura in breve

- **Frontend**: React 18 + Vite + TypeScript + Tailwind. Renderizzato lato client (SPA).
- **Backend**: Lovable Cloud (Supabase managed) — database Postgres, Auth, Storage, Edge Functions.
- **Email**: Lovable Email infra (queue pgmq + cron) con dominio `mail.alazharscholarunion.it`.
- **Hosting consigliato**: piattaforma Lovable (publish), oppure Cloudflare Pages / Netlify / Vercel / VPS con Nginx.

Nessun secret è hardcoded nel frontend. L'unica chiave pubblica esposta è `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key — sicuro per design).

---

## Variabili d'ambiente

| Nome                          | Dove           | Tipo          | Obbligatoria |
| ----------------------------- | -------------- | ------------- | ------------ |
| `VITE_SUPABASE_URL`           | build (.env)   | pubblica      | sì           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build (.env) | pubblica      | sì           |
| `VITE_SUPABASE_PROJECT_ID`    | build (.env)   | pubblica      | sì           |
| `VITE_SITE_URL`               | build (.env)   | pubblica      | consigliata (per SEO/canonical) |
| `SUPABASE_SERVICE_ROLE_KEY`   | edge functions | **segreta**   | sì (auto)    |
| `LOVABLE_API_KEY`             | edge functions | **segreta**   | sì (auto)    |
| `RESEND_API_KEY`              | edge functions | **segreta**   | solo se usi Resend |

> **Mai** esporre chiavi che iniziano per `service_role` nel frontend o in variabili `VITE_*`.

---

## Cambio dominio

Il sito è dominio-agnostico: non ci sono URL hardcoded.

1. Imposta `VITE_SITE_URL=https://nuovodominio.tld` nelle variabili di build.
2. Rebuild + redeploy del frontend.
3. Aggiorna il **Site URL** e i **Redirect URLs** in Lovable Cloud → Auth.
4. Se cambi dominio email, ricrea il dominio in Lovable Cloud → Emails (vedi sezione Email).

I componenti SEO (`src/lib/seo.ts`) usano `VITE_SITE_URL` con fallback a `window.location.origin`.

---

## Ruoli admin

Tabella `user_roles` con enum `app_role`: `super_admin`, `admin`, `editor`, `media_manager`.

- Le RLS usano funzioni `SECURITY DEFINER`: `has_role`, `is_admin`, `can_publish`.
- I ruoli **non** sono memorizzati su `profiles` o `admin_users` (anti-escalation).
- Solo `super_admin` può creare/eliminare admin (via Edge Function `create-admin-user`).
- Protezione applicata: non puoi eliminare te stesso né l'ultimo `super_admin`.

### Aggiungere un nuovo admin
1. Vai in `/admin/users`.
2. Clicca "Aggiungi admin", inserisci email + password temporanea + ruolo.
3. L'admin riceve credenziali da te (non c'è invito email automatico).

### Ripristinare l'ultimo super_admin
Se per qualche motivo non ci sono più super_admin nel DB:
1. Apri `/admin/setup` — la pagina diventa di nuovo accessibile.
2. Crea il nuovo super_admin con email + password.
3. La funzione `bootstrap_first_super_admin` consente questa operazione SOLO se la tabella `user_roles` non ha alcun super_admin.

---

## Email & newsletter

### Email transazionali (auth, hook)
Gestite da Lovable Email infra. Vedi `supabase/functions/auth-email-hook` e `process-email-queue`.
- Coda: `auth_emails` e `transactional_emails` (pgmq).
- Cron ogni 5s, retry automatici, DLQ dopo 5 fallimenti.
- TTL: 15 min (auth), 60 min (transazionali).

### Newsletter campagne (`/admin/newsletter`)
- Edge Function `send-newsletter-campaign` invia a tutti gli iscritti `status = 'active'`.
- `send-newsletter-test` per inviare un'anteprima a un solo indirizzo.
- Doppio invio bloccato: la campagna deve essere `ready` per essere inviata; diventa `sent` dopo l'invio.
- Richiede `RESEND_API_KEY` come secret.

### Configurare Resend (manuale)
1. Crea account su resend.com e verifica `mail.alazharscholarunion.it`.
2. Aggiungi i record SPF/DKIM/DMARC mostrati da Resend al DNS del dominio.
3. Aggiungi `RESEND_API_KEY` in Lovable Cloud → Secrets.

> Se usi Lovable Email, **non** delegare lo stesso sottodominio a Resend — c'è conflitto NS.

### Gestione iscritti
- `/admin/newsletter` mostra subscribers attivi.
- Stati: `active`, `unsubscribed`. Solo `active` ricevono email.
- Unsubscribe via token in tabella `email_unsubscribe_tokens`.

---

## Storage

| Bucket               | Pubblico | Uso                                |
| -------------------- | -------- | ---------------------------------- |
| `images`             | sì       | Immagini sito (CDN)                |
| `covers`             | sì       | Cover articoli/eventi              |
| `thumbnails`         | sì       | Miniature                          |
| `research-public`    | sì       | PDF ricerche pubblicate            |
| `documents`          | no       | PDF privati (signed URL)           |
| `attachments`        | no       | Allegati admin (signed URL)        |
| `fatwa-attachments`  | no       | Allegati richieste fatwa           |
| `research-submissions` | no     | Submission utenti (signed URL)     |

I bucket pubblici **non consentono listing** anonimo (security hardening). I file restano accessibili via URL diretto CDN.

---

## Console & debug

In produzione il bundle Vite rimuove i `console.*` su richiesta tramite plugin. Verifica `vite.config.ts` se serve. I `console.error` per debugging server-side restano negli edge function logs.

---

## Cosa NON fare mai

- Non modificare `src/integrations/supabase/client.ts` o `types.ts` (auto-generati).
- Non aggiungere ruoli alla tabella `profiles` o `admin_users` — usa solo `user_roles`.
- Non chiamare `service_role` dal frontend.
- Non rimuovere RLS da nessuna tabella senza un piano alternativo di sicurezza.
- Non creare manualmente la queue email (`pgmq`, cron) — usa il tool Lovable.

---

## Checklist mensile

- [ ] Verifica `/admin/users`: rimuovi account non più attivi.
- [ ] Controlla `audit_logs` per attività anomale (tabella accessibile via SQL).
- [ ] Verifica `email_send_log`: tasso errori sotto al 5%.
- [ ] Controlla DLQ pgmq: messaggi falliti = ?
- [ ] Verifica `newsletter_subscribers`: pulisci email bounced (`suppressed_emails`).
- [ ] Controlla che le campagne newsletter inviate abbiano `sent_count > 0`.
- [ ] Apri il sito su mobile + RTL: nessun layout rotto.

## Checklist semestrale

- [ ] Aggiorna dipendenze npm critiche (security patches): `bun update` con review.
- [ ] Esegui security scan completo (Lovable → Security).
- [ ] Verifica record DNS dominio email ancora validi.
- [ ] Test ripristino super_admin (su staging, non in produzione!).
- [ ] Rivedi RLS policies di tutte le tabelle.
- [ ] Verifica backup database (vedi `BACKUP_RECOVERY.md`).

## Checklist annuale

- [ ] Rotazione `LOVABLE_API_KEY` se necessario (tool dedicato).
- [ ] Rotazione service-role key (richiede re-run di `setup_email_infra`).
- [ ] Aggiornamento certificato SSL (auto se usi Lovable/Cloudflare).
- [ ] Audit completo dei ruoli admin: chi serve davvero?
- [ ] Pulizia tabelle storage: file orfani non più referenziati.
- [ ] Backup completo + test di ripristino end-to-end.
- [ ] Aggiorna questa guida con eventuali nuove pratiche.
