
# Major Platform Expansion — Implementation Plan

This adds four large new subsystems on top of the existing site. Nothing already working is removed or renamed: existing routes, RLS policies, autosave, newsletter, live streaming, fatwa private attachments, public fatwa files, reviews, RTL, and admin layout stay exactly as they are. All new admin pages are added as new routes under `/admin/*` and new public routes under fresh paths.

Given the scope (4 large modules, ~10 new tables, ~6 new admin pages, ~3 new public pages, 4 new storage buckets, a new permission engine), I will deliver this in **4 sequential phases** — each phase is shippable on its own, runs typecheck + build, and leaves the site fully functional. Phases land in this order so the permission system is in place before the new admin pages depend on it.

---

## Phase 1 — Granular role & permission system (foundation)

Today roles are an enum `super_admin | admin | editor | media_manager` checked via `has_role` / `is_admin` / `can_publish`. I will add **module-level permissions** on top, without removing the existing roles or helpers (all current policies keep working).

New tables:
- `admin_modules` — catalog of modules (`news`, `library`, `videos`, `events`, `live`, `pages`, `media`, `messages`, `newsletter`, `fatwa`, `fatwa_files`, `feedback`, `sharia_academy`, `civilizational_dialogue`, `research`, `news_ticker`, `settings`, `admins`, `memberships`, `membership_applications`, `fatwa_departments`, `quran_courses`, `quran_enrollments`, `roles`).
- `admin_module_grants(user_id, module_key, can_read, can_write, can_delete)`.

New SECURITY DEFINER helper:
- `public.has_module_access(_user_id uuid, _module text, _level text)` — returns true if user is `super_admin`/`admin` OR has a matching grant. Used by new tables' RLS and by the admin UI to gate menu items.

New admin page `/admin/roles` (super_admin only):
- List admin users, assign module grants in a matrix (read / write / delete per module), search, save.
- Uses `useFormDraft` with key `roles:<user_id>`.

`AdminLayout` sidebar filters items via `has_module_access` so a "fatwa manager" only sees Fatwa-related entries. Existing super_admin / admin behavior is unchanged.

---

## Phase 2 — Fatwa departments

New table `fatwa_departments` (`title`, `slug`, `description`, `icon`, `is_active`, `display_order`). Adds nullable `department_id` columns to existing `fatwa_arbitration_requests` and `fatwa_public_files` — **nullable on purpose** so existing rows and existing INSERT policies keep working. RLS on the new column is added without rewriting existing INSERT validators (only extends them with an optional `department_id IS NULL OR exists` check).

New admin page `/admin/fatwa-arbitration/departments` (gated by `fatwa` module): CRUD departments, drag-order, autosave.

Public `/fatwa-arbitration`: above the existing form, render a department grid (icon + title + description). Selecting a department prefills the form's new department field. Existing form, files list, and reviews stay in their current order.

---

## Phase 3 — Memberships (payment-ready, no provider wired)

New tables:
- `membership_types` (title, slug, description, price numeric, currency, duration_months, is_active, application_requirements jsonb, benefits jsonb, sort_order).
- `membership_applications` (full_name, email, phone, country, city, type_id, bio, attachment_url, agreed_terms, status `new|approved|rejected`, admin_notes). Same anonymous-INSERT hardening pattern as existing forms: `status='new' AND admin_notes IS NULL` + length checks.
- `memberships` (user_id nullable for guest, type_id, status `pending|active|expired|cancelled`, starts_at, ends_at).
- `membership_payments` (membership_id, method_key, amount, currency, status `pending|paid|failed|refunded`, reference, paid_at, raw jsonb).
- `membership_payment_methods` (title, description, provider_key `stripe|paypal|bank|manual|other`, is_enabled, instructions, sort_order).

No payment SDK is added — the schema, admin UI, and a `PaymentInstructions` block on the application success page are ready for a later wire-up.

New storage bucket: `membership-attachments` (private). RLS: anon can insert into their own path, admins with `memberships` module can read.

New admin pages (all autosaved):
- `/admin/memberships` — types CRUD.
- `/admin/memberships/applications` — review queue with approve/reject + notes.
- `/admin/memberships/methods` — payment methods CRUD (enable/disable, instructions).

New public page `/memberships`:
- Premium card grid (one per active type) reusing the existing card / gradient tokens.
- "قدم الآن" → `/memberships/apply?type=<slug>` with the application form (validation, anti-spam honeypot + length caps, secure upload, autosave draft, success toast).

Adds nav entry "العضوية" (header + footer) without disturbing existing entries.

---

## Phase 4 — Quran Courses platform

New tables:
- `quran_teachers` (name, bio, photo_url, sort_order, is_active).
- `quran_courses` (title, slug, description, cover_image, intro_video_url, teacher_id, duration, level `beginner|intermediate|advanced`, category, publish_status `draft|published|archived`, sort_order).
- `quran_lessons` (course_id, title, description, video_url, audio_url, pdf_url, text_content, attachments jsonb, sort_order, publish_status).
- `quran_enrollments` (course_id, full_name, email, phone, country, notes, status `new|approved|rejected`, admin_notes). Anonymous INSERT hardened like other forms.

New storage buckets: `quran-covers` (public), `quran-videos` (public), `quran-audio` (public), `quran-files` (public). Validated file types + size limits enforced client-side; RLS allows uploads only to admins with `quran_courses` write.

New admin pages:
- `/admin/quran-courses` — courses list + editor with lesson reorder (drag), media upload via existing `FileUploadField`, autosave.
- `/admin/quran-courses/teachers` — teachers CRUD.
- `/admin/quran-courses/enrollments` — enrollment review queue.

New public pages:
- `/quran-courses` — card grid with cover, teacher, level, lesson count.
- `/quran-courses/:slug` — course detail with intro video, lesson list (lazy-loaded media), enrollment CTA.
- Reuses existing `ReaderFeedback` at the bottom.

---

## Cross-cutting

- **Dashboard widgets**: extend `Dashboard.tsx` with cards for pending membership applications, pending enrollments, fatwa departments count, pending fatwa requests, latest reviews. Existing widgets stay.
- **Autosave**: every new admin form uses `useFormDraft` + `DraftStatus`, with unique keys (`membership-type:<id>`, `membership-method:<id>`, `fatwa-dept:<id>`, `quran-course:<id>`, `quran-lesson:<id>`, `quran-teacher:<id>`, `roles:<user_id>`).
- **Security**: zod validation on every public form; honeypot field; size limits on uploads; new RLS policies follow the existing "anon can insert with hard caps, only admins read/update, super_admin deletes" pattern; `has_module_access` gates admin reads for department managers. A security scan is run after each phase and any `warn`+ finding from the new code is fixed before moving on.
- **Design**: green/gold/white tokens already in `index.css` are reused (no new colors). New cards reuse existing card/gradient classes. RTL is inherited from `SiteLayout`. Mobile is verified at 360 / 768 / 1280.
- **i18n**: Arabic labels match the request; Italian translations added to `src/i18n/content.ts` where the existing pattern requires it.

## Technical notes

- Migrations are split per phase so each can be reviewed/approved independently.
- No changes to: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts` (regenerated), Cloudflare middleware, existing routes, existing RLS, existing edge functions, existing styling tokens.
- New department / module / membership columns added to existing tables are all nullable with safe defaults so no existing row or insert breaks.
- A final security scan + typecheck + build run closes the work, and the report you asked for (12 items) is delivered at the end.

## Suggested approval order

Approve Phase 1 first (foundation). After it lands and the build is green, I'll proceed to Phase 2 → 3 → 4 in the same conversation unless you ask to pause.
