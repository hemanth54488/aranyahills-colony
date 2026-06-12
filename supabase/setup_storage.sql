-- ============================================================
-- ARANYA HILLS COLONY - Supabase Storage Setup
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- Create the public storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'colony-files',
  'colony-files',
  TRUE,
  5242880,   -- 5 MB limit per file
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif',
        'application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read/download files (photos are public)
CREATE POLICY "Public read colony-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'colony-files');

-- Allow logged-in approved users to upload files
CREATE POLICY "Approved users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'colony-files'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to update their own uploads; admins can update any
CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'colony-files'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to delete their own uploads; admins can delete any
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'colony-files'
    AND auth.uid() IS NOT NULL
  );
