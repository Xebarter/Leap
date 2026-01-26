-- ============================================================================
-- SETUP STORAGE BUCKET FOR TENANT DOCUMENTS
-- ============================================================================
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Create storage bucket for tenant documents (PRIVATE - not public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-documents', 'tenant-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ============================================================================
-- RLS POLICIES FOR TENANT DOCUMENTS STORAGE
-- ============================================================================

-- Policy 1: Tenants can view their own documents
CREATE POLICY "Tenants can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Tenants can upload their own documents
CREATE POLICY "Tenants can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND auth.role() = 'authenticated'
);

-- Policy 3: Tenants can update their own documents
CREATE POLICY "Tenants can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Tenants can delete their own documents
CREATE POLICY "Tenants can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Admins can view all tenant documents
CREATE POLICY "Admins can view all tenant documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy 6: Admins can manage all tenant documents
CREATE POLICY "Admins can manage all tenant documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'tenant-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'tenant-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  '✅ Storage bucket created' as status,
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'tenant-documents';

SELECT 
  '✅ Storage policies created' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%tenant%document%';

-- ============================================================================
-- ✅ If you see the bucket and policies above, you're ready to go!
-- ============================================================================
