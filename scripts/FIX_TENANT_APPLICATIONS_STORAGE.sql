-- =====================================================
-- FIX TENANT APPLICATIONS STORAGE BUCKET
-- =====================================================
-- This script ensures the tenant-applications bucket exists
-- and has the correct policies for both user and service role access
-- =====================================================

-- Create storage bucket for application documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-applications', 'tenant-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can upload application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all tenant application files" ON storage.objects;

-- Allow service role to manage all files (needed for API upload route)
CREATE POLICY "Service role can manage all tenant application files"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'tenant-applications');

-- Allow authenticated users to upload their application documents
CREATE POLICY "Users can upload application documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-applications' AND
    auth.uid() IS NOT NULL
  );

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tenant-applications' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
      )
    )
  );

-- Allow admins to view all documents
CREATE POLICY "Admins can view all documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tenant-applications' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Allow admins to delete documents
CREATE POLICY "Admins can delete documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tenant-applications' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'tenant-applications';

-- Check policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%tenant%';
