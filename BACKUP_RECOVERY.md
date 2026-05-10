# Backup & Recovery — Al-Azhar Scholars Union

Strategia di backup e procedure di ripristino. Eseguila **prima** che serva.

---

## 1) Backup automatici Lovable Cloud

Il database Postgres è gestito da Lovable Cloud (Supabase). Per default include:
- **Backup giornalieri** del database (retention dipende dal piano).
- **Point-in-time recovery (PITR)** sui piani superiori.

Verifica lo stato in: Lovable → Cloud → Database → Backups.

> ⚠️ I backup gestiti coprono il database, **non** lo storage (file caricati).

---

## 2) Backup manuale del database

### Opzione A — Export SQL completo (consigliato mensile)
Dal terminale con `pg_dump` (richiede `SUPABASE_DB_URL`):

```bash
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --no-owner --no-privileges \
  -f "backup-$(date +%Y%m%d).sql"
```

### Opzione B — Export per tabella (CSV)
Per backup leggibili / archiviazione legale:

```bash
psql "$SUPABASE_DB_URL" -c "\COPY public.newsletter_subscribers TO 'subscribers.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.contact_messages TO 'contact_messages.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.fatwa_arbitration_requests TO 'fatwa.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.research_submissions TO 'research.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.dialogue_requests TO 'dialogue.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.academy_applications TO 'academy.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.news_posts TO 'news.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.events TO 'events.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.library_items TO 'library.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.videos TO 'videos.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.live_streams TO 'live.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.site_pages TO 'pages.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.site_settings TO 'settings.csv' CSV HEADER"
psql "$SUPABASE_DB_URL" -c "\COPY public.user_roles TO 'roles.csv' CSV HEADER"
```

Conserva i file in:
- Cloud storage privato (Google Drive, Dropbox dell'organizzazione).
- Disco esterno cifrato per backup mensili.
- Mai in repository pubblici.

### Opzione C — Export via Lovable Cloud UI
Cloud → Database → Tables → seleziona tabella → Export.

---

## 3) Backup file storage

I bucket non sono inclusi nei backup database. Per scaricare tutti i file di un bucket:

```bash
# richiede CLI supabase configurato
supabase storage cp --recursive ss://images ./backup-images/
supabase storage cp --recursive ss://covers ./backup-covers/
supabase storage cp --recursive ss://documents ./backup-documents/
supabase storage cp --recursive ss://research-public ./backup-research/
# e così via per ogni bucket
```

Frequenza consigliata: trimestrale.

---

## 4) Backup configurazione

Salva periodicamente:
- `.env` (chiavi pubbliche — **non** committare).
- Lista dei secrets configurati (nomi, non valori) — vedi Cloud → Secrets.
- Snapshot della tabella `site_settings` (contenuti homepage, contatti, social).
- Lista admin attivi (`SELECT email FROM admin_users WHERE is_active`).

---

## 5) Procedure di ripristino

### A) Ripristino super_admin se nessuno è rimasto

Se la tabella `user_roles` non contiene più alcun `super_admin`:

1. Vai su `https://<tuo-dominio>/admin/setup`.
2. La pagina è automaticamente accessibile (controllo via `public_has_any_super_admin`).
3. Inserisci email + password (≥8 caratteri).
4. Si crea l'utente in Auth + viene assegnato `super_admin` via `bootstrap_first_super_admin`.

> La funzione rifiuta la chiamata se esiste già un super_admin (anti-takeover).

### B) Ripristino accesso admin (password persa)

1. L'admin va su `/admin/login` → "Hai dimenticato la password?".
2. Riceve email con magic link o reset (richiede infrastruttura email funzionante).

In alternativa, un super_admin può:
1. Creare un nuovo account in `/admin/users` con password temporanea.
2. Disattivare il vecchio account.

### C) Ripristino database da backup SQL

```bash
# 1. Crea un nuovo progetto Lovable Cloud (o ripristina lo stesso)
# 2. Recupera la nuova SUPABASE_DB_URL
# 3. Importa
psql "$NEW_SUPABASE_DB_URL" < backup-YYYYMMDD.sql
```

### D) Ripristino singola tabella

```bash
psql "$SUPABASE_DB_URL" -c "TRUNCATE public.contact_messages;"
psql "$SUPABASE_DB_URL" -c "\COPY public.contact_messages FROM 'contact_messages.csv' CSV HEADER"
```

> ⚠️ `TRUNCATE` cancella tutto. Usa solo se sei sicuro. In produzione preferisci `INSERT ... ON CONFLICT`.

### E) Ripristino file storage

```bash
supabase storage cp --recursive ./backup-images/ ss://images
```

---

## 6) Test di ripristino

**Almeno una volta l'anno**:
1. Crea un progetto Lovable Cloud di test.
2. Ripristina backup recente (DB + storage).
3. Verifica che tutto funzioni (login admin, lettura news, upload file).
4. Documenta tempi e problemi incontrati.

Un backup non testato è un backup che non esiste.

---

## 7) Cosa **non** è coperto da backup

- Email già inviate (sono in Resend/Lovable Email logs, non recuperabili).
- Sessioni utente attive.
- Cache CDN del frontend (si rigenera automaticamente).
- Edge Functions deploy history (recuperabile dal repo Git).

---

## 8) Conservazione legale (GDPR)

- **Newsletter subscribers**: conservare prova del consenso (campo `subscribed_at`).
- **Contact messages**: definire retention (es. 24 mesi), poi cancellare.
- **Fatwa requests**: dati sensibili — limitare accesso e cancellare su richiesta utente.
- **Audit logs**: conservare almeno 12 mesi per accountability.

Documenta la policy in `Privacy.tsx` del sito.
