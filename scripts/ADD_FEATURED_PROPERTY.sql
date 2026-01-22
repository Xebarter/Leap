-- ============================================================================
-- ADD FEATURED PROPERTY FLAG TO PROPERTIES TABLE
-- ============================================================================
-- This migration adds an is_featured flag to mark properties for display
-- on the public landing page.
-- ============================================================================

-- Add the is_featured column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for fast lookups of featured properties
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON public.properties(is_featured);

-- Create a composite index for featured + active properties (common query pattern)
CREATE INDEX IF NOT EXISTS idx_properties_featured_active ON public.properties(is_featured, is_active);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================
-- Check if column was added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'properties' AND column_name = 'is_featured';

-- Check featured properties:
-- SELECT id, title, is_featured FROM public.properties WHERE is_featured = true;

-- Mark a property as featured (example):
-- UPDATE public.properties SET is_featured = true WHERE id = 'your-property-id';
