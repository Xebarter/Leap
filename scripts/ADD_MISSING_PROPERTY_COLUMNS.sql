-- ============================================================================
-- Add Missing Property Columns
-- ============================================================================

-- Add image_urls array column (for multiple images)
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add property_code column (unique identifier)
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS property_code TEXT UNIQUE;

-- Add is_featured column (for featured properties)
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON public.properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_property_code ON public.properties(property_code);

-- Add comments
COMMENT ON COLUMN public.properties.image_urls IS 'Array of image URLs for the property gallery';
COMMENT ON COLUMN public.properties.property_code IS 'Unique property identifier code';
COMMENT ON COLUMN public.properties.is_featured IS 'Whether this property is featured on the homepage';
