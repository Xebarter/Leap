-- Setup Storage Bucket for Property Images
-- Run this in your Supabase SQL Editor

-- Create storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up RLS policies for the storage bucket
-- Allow public access to read images
CREATE POLICY IF NOT EXISTS "Public Access to Property Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow authenticated users to upload images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploaded images
CREATE POLICY IF NOT EXISTS "Authenticated users can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete images
CREATE POLICY IF NOT EXISTS "Authenticated users can delete property images"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Allow service role to do everything (for API routes)
CREATE POLICY IF NOT EXISTS "Service role can manage all property images"
ON storage.objects FOR ALL
USING (bucket_id = 'property-images' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'service_role');
