
# Piano di stabilizzazione, performance e sincronizzazione

Obiettivo: rendere visibili tutte le ultime modifiche nel sito live, uniformare il responsive, migliorare Core Web Vitals, preparare la verifica Google Search Console via file HTML, e mostrare più news in homepage — senza toccare funzionalità esistenti (Auth, RLS, autosave, Open Graph, newsletter, fatwa, memberships, quran, khutbahs, live, admin).

---

## 1) Perché le modifiche non si vedono nel live

Analisi prevista (read-only, poi fix):

- `index.html`: nessun service worker registrato, ma controllo che non resti un SW vecchio da una versione precedente. Se presente, aggiungo uno script "unregister + clear caches" una tantum in `index.html` per pulire i client esistenti.
- `vite.config.ts`: aggiungo `build.rollupOptions.output` con hashing esplicito (`entryFileNames`, `chunkFileNames`, `assetFileNames` con `[hash]`) — Vite lo fa già di default, ma forzo coerenza per evitare chunk stantii.
- `public/_redirects` / `functions/_middleware.ts`: verifico che non aggiungano header `Cache-Control` aggressivi su `index.html`. `index.html` deve essere `no-cache`, gli asset hashati `immutable`. Aggiungo un `public/_headers` Cloudflare Pages:
  ```
  /index.html
    Cache-Control: public, max-age=0, must-revalidate
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```
- Nessuna modifica al routing o al middleware esistente oltre alle intestazioni cache.

Risultato atteso: dopo il prossimo Publish/Update, niente più hard refresh richiesto.

---

## 2) Responsive uniforme (mobile / tablet / desktop)

Revisione mirata, senza cambiare il design premium verde/oro/bianco né la struttura RTL.

File toccati (solo classi Tailwind + min-height/aspect-ratio):

- `src/components/Header.tsx` — verifica overflow del mega-menu "الأقسام" su mobile, padding coerente.
- `src/components/PageHero.tsx` — riduzione padding mobile (`py-14 md:py-20 lg:py-28`), `heading-display` già scala.
- `src/pages/Home.tsx` — spaziatura sezioni, grid news (vedi §5), card uniformi con `aspect-[16/10]` fissi.
- `src/pages/Memberships.tsx`, `src/pages/Quran.tsx`, `src/pages/Khutbahs.tsx` — card grid responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, font scaling, niente hero gigante su mobile.
- `src/index.css` — aggiungo `html, body { overflow-x: hidden; }` di sicurezza, utility `.heading-display` con clamp se serve.
- Footer e dialog: controllo padding mobile.

Nessuna modifica a logica, query, RLS o forms.

---

## 3) Performance & Core Web Vitals

CLS:
- Tutte le `<img>` e `SmartImage` riceveranno `width`/`height` o un wrapper con `aspect-ratio` esplicito (`AspectRatio` di shadcn dove serve).
- Skeleton con altezza fissa già presenti — verifico card grid news/library/videos.

LCP:
- `index.html`: aggiungo `<link rel="preload" as="image" href="/og-image.png" fetchpriority="high">` solo se l'hero homepage usa quell'immagine; altrimenti preload dell'asset hero effettivo.
- Font Cairo: aggiungo `&display=swap` (già presente) e `<link rel="preload" as="style">`.
- `loading="eager"` + `fetchpriority="high"` sull'immagine LCP della homepage; tutte le altre `loading="lazy" decoding="async"` (già in `SmartImage`).

JS/Bundle:
- `src/App.tsx`: converto le pagine admin e pagine pesanti (Library, Videos, Quran, Khutbahs, Memberships, NewsDetail, EventDetail, LiveDetail, tutte le `pages/admin/*`) in `React.lazy()` con `<Suspense>` fallback skeleton. La Home resta eager.
- Verifico che non ci siano subscribe Supabase realtime senza cleanup.

CSS:
- Nessuna animazione nuova; rimuovo eventuali `transition: all` pesanti se trovati.

Misurazione: dopo il fix uso `browser--performance_profile` sulla homepage mobile-viewport per confermare miglioramenti.

---

## 4) Google Search Console — file HTML

Procedura quando mi invii il file `googleXXXXXXXX.html`:

1. Lo salvo in `public/googleXXXXXXXX.html` — Vite lo copia tale e quale in `dist/`.
2. Cloudflare Pages lo serve come statico a `https://alazharscholarunion.it/googleXXXXXXXX.html` con `Content-Type: text/html` e HTTP 200.
3. Verifico che `functions/_middleware.ts` non lo intercetti — se serve, aggiungo bypass esplicito per file `.html` di verifica all'inizio del middleware (pattern: `if (pathname.startsWith('/google') && pathname.endsWith('.html')) return next();`).
4. Aggiungo riga in `public/robots.txt` per essere sicuri non venga bloccato (già è `Allow: /`).
5. Il file resta nel repo, quindi sopravvive ai deploy.

Posso fare tutto questo già ora con un file placeholder oppure aspettare che tu mandi il contenuto reale — preferisco aspettare il file vero per evitare nomi sbagliati.

---

## 5) Homepage — sezione "آخر الأخبار والبيانات"

Modifica solo `src/pages/Home.tsx` (sezione news):

- Aumento da 3 a **5** articoli mostrati.
- Layout misto **featured + compact**:
  - Su `lg`: 1 card featured grande (col-span-2) + 4 card compatte (2x2) → griglia `lg:grid-cols-4` con la featured che occupa `lg:col-span-2 lg:row-span-2`.
  - Su `md`: griglia 2 colonne.
  - Su mobile: 1 colonna, card compatte con immagine 16/10.
- Tipografia ridotta nelle card compatte (`text-base` titolo, `text-xs` meta), padding `p-4` invece di `p-6`.
- Stessa identità (bordi, ombre, colori semantici), nessun nuovo token.

---

## 6) Garanzie di non rottura

Non tocco: Open Graph, middleware SEO (oltre al bypass file Google), autosave, feedback, memberships logica, quran logica, khutbahs logica, fatwa, admin permissions, uploads, routing, RLS, newsletter, live streaming. Solo classi, lazy import, header cache, e file statici nuovi.

---

## 7) Verifica finale

- Build + typecheck automatici.
- `browser--performance_profile` su `/` viewport 390x844 e 1366x768.
- Controllo console errors.
- Lista finale: cosa è cambiato, cosa resta manuale (Publish + invio file Google).

---

## Dettagli tecnici (riassunto file modificati)

```text
public/_headers              [NEW]   cache policy
public/robots.txt            [edit]  (nessun cambio sostanziale, conferma)
index.html                   [edit]  preload hero, sw-unregister snippet
vite.config.ts               [edit]  output hashing esplicito
src/App.tsx                  [edit]  React.lazy per pagine pesanti + Suspense
src/index.css                [edit]  overflow-x guard
src/components/Header.tsx    [edit]  responsive fixes
src/components/PageHero.tsx  [edit]  padding mobile
src/components/SmartImage.tsx[edit]  width/height props passthrough
src/pages/Home.tsx           [edit]  news 5 + layout featured, responsive
src/pages/Memberships.tsx    [edit]  grid responsive
src/pages/Quran.tsx          [edit]  grid responsive
src/pages/Khutbahs.tsx       [edit]  grid responsive
functions/_middleware.ts     [edit]  bypass file verifica Google (al ricevimento file)
public/google<TOKEN>.html    [NEW]   quando mi mandi il file
```

Procedo con l'implementazione?
