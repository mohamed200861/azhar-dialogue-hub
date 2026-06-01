ALTER TABLE public.quran_teachers ADD COLUMN IF NOT EXISTS slug text;
UPDATE public.quran_teachers
SET slug = COALESCE(NULLIF(slug,''), 'teacher-' || substr(id::text, 1, 8))
WHERE slug IS NULL OR slug = '';
ALTER TABLE public.quran_teachers ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS quran_teachers_slug_key ON public.quran_teachers(slug);