## Obiettivo

Rendere la voce **العضوية** visivamente distinta e "premium" all'interno del dropdown «الأقسام» (desktop + mobile), e migliorare l'estetica delle descrizioni sotto ogni voce del menu — in particolare le tre nuove sezioni (خطب وخطباء، هيئة القرآن الكريم، العضوية).

Nessuna modifica a routing, RLS, contenuti o altre funzionalità.

## Modifiche

### 1. Marcatura "premium" nella sorgente dati
File: `src/i18n/content.ts`
- Aggiungere un campo opzionale `premium?: boolean` al tipo di `specializedSections`.
- Impostare `premium: true` solo sulla voce `/memberships` (العضوية).

### 2. Stile premium nel dropdown desktop
File: `src/components/Header.tsx` — `DropdownMenuContent`
- Allargare il pannello e dare più respiro fra le voci.
- Voce العضوية:
  - Sfondo con gradiente sottile oro→primary (`from-amber-50 to-primary/5` in tema chiaro, tinte equivalenti su dark) e bordo end (`border-e-2`) color oro/amber.
  - Piccola icona corona/badge `Crown` (lucide) a fianco del titolo.
  - Mini-pill «حصري» allineata a sinistra (in stile gold).
  - Hover con leggero shimmer (transition `bg-amber-100/40`).
- Le altre voci restano con lo stile attuale ma con tipografia descrizione più elegante (vedi §4).

### 3. Stile premium nel menu mobile
File: `src/components/Header.tsx` — blocco mobile «الأقسام المتخصصة»
- Stessa logica: la voce العضوية riceve container con gradiente oro/primary, badge Crown e pill «حصري».
- Mantenere allineamento RTL e padding coerenti col resto del menu.

### 4. Tipografia più elegante per le descrizioni
Sia desktop che mobile dropdown:
- Titolo voce: `font-semibold text-[13.5px] tracking-tight leading-snug`.
- Descrizione: passare da `text-[11px] text-muted-foreground` a `text-[11.5px] text-muted-foreground/90 leading-relaxed line-clamp-2 mt-0.5`.
- Spaziatura interna: `py-2.5 px-3` per dare più respiro.
- Separatore sottile (`border-t border-border/40`) fra una voce e l'altra nel dropdown desktop, tranne sopra la voce premium dove il separatore diventa `border-amber-200/60`.

### 5. Token colore
- Riutilizzare token esistenti del design system (primary, amber-50/100/200, muted-foreground).
- Non introdurre nuovi token in `index.css` / `tailwind.config.ts`.
- Tutto in HSL via classi Tailwind già disponibili — coerente con palette verde/oro/bianco esistente.

## Cosa NON cambia

- Ordine delle voci nel dropdown.
- Route, link, descrizioni testuali.
- Stile dell'header, logo, nav principale, CTA «تواصل معنا».
- Tutte le altre pagine e componenti.

## File toccati

- `src/i18n/content.ts` (aggiunta flag `premium`)
- `src/components/Header.tsx` (rendering premium + tipografia descrizioni, desktop e mobile)
