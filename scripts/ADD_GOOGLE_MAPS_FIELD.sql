-- ============================================================================
-- Add Google Maps embed URL field to properties table
-- ============================================================================

-- Add the google_maps_embed_url column to properties table
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.properties.google_maps_embed_url IS 'Google Maps embed URL - users can paste the full Google Maps link or embed code';

-- Create an index for filtering by maps URL presence
CREATE INDEX IF NOT EXISTS idx_properties_has_maps ON public.properties(google_maps_embed_url) 
WHERE google_maps_embed_url IS NOT NULL;
