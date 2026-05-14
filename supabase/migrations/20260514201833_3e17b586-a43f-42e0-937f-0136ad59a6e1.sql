-- Enforce per-upload unique folder prefix on anonymous storage uploads
-- so anonymous users cannot overwrite each other's files.

DROP POLICY IF EXISTS "Anyone can upload fatwa attachment" ON storage.objects;
DROP POLICY IF EXISTS "Anyone uploads research submission file" ON storage.objects;

CREATE POLICY "Anyone can upload fatwa attachment"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'fatwa-attachments'
  AND lower(storage.extension(name)) = ANY (ARRAY['pdf','png','jpg','jpeg','webp'])
  AND COALESCE(((metadata ->> 'size')::bigint), 0) < 8388608
  AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

CREATE POLICY "Anyone uploads research submission file"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'research-submissions'
  AND lower(storage.extension(name)) = ANY (ARRAY['pdf','doc','docx'])
  AND COALESCE(((metadata ->> 'size')::bigint), 0) < 20971520
  AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);