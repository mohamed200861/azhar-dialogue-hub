# Admin Guide — Al-Azhar Scholars Union

Guida operativa per chi gestisce i contenuti dal pannello admin.

---

## Accesso

URL: `/admin/login` (es. `https://alazharscholarunion.it/admin/login`).

Usa le credenziali ricevute dal super_admin. Se hai dimenticato la password:
- Clicca "Hai dimenticato la password?" sul login.
- Riceverai un'email per reimpostarla (l'infrastruttura email deve essere attiva).

---

## Ruoli e permessi

| Ruolo            | Cosa può fare                                                    |
| ---------------- | ---------------------------------------------------------------- |
| `super_admin`    | Tutto: gestire admin, eliminare contenuti, modificare settings.  |
| `admin`          | Pubblicare/modificare/eliminare contenuti, vedere subscribers.   |
| `editor`         | Creare e modificare contenuti, **non** eliminare.                |
| `media_manager`  | Gestire file in `/admin/media-manager`. Vedere lista contenuti.  |

Solo `super_admin` può creare/eliminare altri admin.

---

## Sezioni del pannello

### 📰 News (`/admin/news`)
- Crea/modifica articoli con titolo, slug, contenuto, immagine cover.
- Stati: `draft`, `published`. Solo i `published` appaiono pubblicamente.
- SEO: compila `seo_title`, `seo_description`, `keywords` per ogni articolo.

### 📅 Eventi (`/admin/events`)
- Eventi futuri/passati con data, luogo, link registrazione.
- `is_featured = true` per evidenziarli in homepage.

### 📚 Biblioteca (`/admin/library`)
- Carica PDF in `documents` (privato) o `research-public` (pubblico).
- Conta download tramite `downloads_count`.

### 🎬 Video (`/admin/videos`)
- Supporta YouTube, Facebook, embed iframe.
- L'helper `getYouTubeEmbed` converte qualsiasi URL YouTube in formato embed.

### 📡 Live (`/admin/live`)
- Stati: `scheduled`, `live`, `completed`, `cancelled`.
- `expires_at` nasconde automaticamente le live scadute.
- `auto_archive`: dopo `ended_at`, mostra solo il replay.
- `hide_from_homepage` / `hide_from_videos` per controllo fine.

### 📜 News Ticker (`/admin/news-ticker`)
- Notizie scorrevoli in alto. `display_order` controlla l'ordine.
- Disattiva con `is_active = false` invece di eliminare.

### 📧 Newsletter (`/admin/newsletter`)
- **Iscritti**: vedi lista, esporta, elimina (solo super_admin/admin).
- **Campagne**:
  1. Crea con titolo + contenuto HTML.
  2. Stato `draft` → modifica liberamente.
  3. Cambia in `ready` quando pronta.
  4. Invia test a un'email per vedere l'anteprima.
  5. Conferma "INVIA" per spedire a tutti gli `active`.
- Dopo l'invio: `status = sent`, `sent_at`, `sent_count`, `error_count` aggiornati.
- **Doppio invio bloccato**: una campagna `sent` non può essere reinviata.

### ⚖️ Fatwa & arbitrato (`/admin/fatwa-arbitration`)
- Richieste pubbliche con allegati (signed URL, scadenza 10 min).
- Stati: `new`, `in_review`, `responded`, `archived`.
- Risposte salvate in `response_text` (visibili solo agli admin).

### 🎓 Accademia (`/admin/sharia-academy`)
- Programmi formativi: `course`, `seminar`, `workshop`.
- Candidature: visualizza richieste con stato.

### 🤝 Dialogo civilizzazionale (`/admin/civilizational-dialogue`)
- Iniziative + richieste di partecipazione/contatto.

### 🔬 Ricerche (`/admin/research-studies`)
- Pubblica paper accademici. PDF in `research-public` (pubblico) o link esterno.
- Submission utenti in `research-submissions` (privato).

### 📄 Pagine (`/admin/pages`)
- Pagine statiche: About, Vision, Privacy, Terms, ecc.
- `page_key` unico identifica la pagina (non cambiarlo dopo creazione).
- `show_in_header` / `show_in_footer` controllano i menu.

### ⚙️ Impostazioni (`/admin/settings`)
- Email contatto pubblica e admin.
- Social links, footer text.
- Logo, favicon, hero homepage, CTA.

### 👥 Utenti (`/admin/users`) — solo super_admin
- Aggiungi nuovo admin (Edge Function `create-admin-user`).
- Cambia ruoli.
- Disattiva/elimina (con conferma testuale "ELIMINA").
- **Non puoi**: eliminare te stesso, eliminare l'ultimo super_admin.

### 🗂️ Media Manager (`/admin/media-manager`)
- Upload immagini/PDF nei bucket pubblici.
- Copia URL pubblico per usarlo nei contenuti.
- Limite 20 MB per file.

### 💬 Messaggi (`/admin/messages`)
- Messaggi dal form `/contact`.
- Stati: `new`, `read`, `replied`, `archived`.

---

## Best practice editoriali

### SEO
- Titolo: max 60 caratteri, con keyword.
- Description: max 160 caratteri.
- Cover image: 1200×630 (formato OpenGraph).
- Slug: solo lettere, numeri, trattini. Niente spazi o caratteri speciali.

### Immagini
- Comprimile prima di caricare (max 500 KB consigliato).
- Usa formato `.webp` quando possibile.
- Sempre con `alt text` significativo.

### Pubblicazione contenuti
1. Salva come `draft`.
2. Anteprima visiva.
3. Cambia a `published` solo quando tutto è verificato.

### Cancellazioni
- **Mai cancellare** subscribers newsletter senza export prima.
- **Mai cancellare** news/eventi pubblicati: cambia status a `archived` (se disponibile) o `draft`.
- Le richieste fatwa sono dati personali: cancella entro 24 mesi o secondo la policy.

---

## Risoluzione problemi comuni

| Problema | Soluzione |
| --- | --- |
| "Signups not allowed" creando admin | Stai usando il vecchio flusso. Vai in `/admin/users` e usa il bottone "Aggiungi". |
| Newsletter non parte | Verifica che `RESEND_API_KEY` sia configurata. Vedi `MAINTENANCE_GUIDE.md`. |
| Immagine non si carica | File > 20 MB? URL contiene caratteri strani? Verifica console. |
| Live non appare in home | Controlla `show_on_homepage = true` e `hide_from_homepage = false`. |
| Email non arrivano agli iscritti | DNS dominio email non verificato. Apri Lovable → Cloud → Emails. |

---

## Contatti tecnici

- Repo Lovable: [link al progetto]
- Backend: Lovable Cloud (managed)
- Email: Lovable Email infrastructure
- DNS dominio: gestito da [provider]

Per problemi non risolvibili dal pannello, contatta lo sviluppatore.
