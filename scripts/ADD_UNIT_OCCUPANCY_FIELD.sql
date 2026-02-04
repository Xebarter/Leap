-- ============================================================================
-- ADD is_occupied FIELD TO property_units TABLE
-- ============================================================================
-- This adds the is_occupied field to property_units table to track which
-- individual units are occupied (for apartment buildings and hostels)
-- ============================================================================

-- Add is_occupied column to property_units table
ALTER TABLE public.property_units 
ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN public.property_units.is_occupied IS 'Whether this specific unit is currently occupied (paid for)';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_property_units_is_occupied ON public.property_units(is_occupied);

-- Update existing units to match their property's occupancy status (optional)
-- This ensures data consistency with any existing occupied properties
UPDATE public.property_units pu
SET is_occupied = p.is_occupied
FROM public.properties p
WHERE pu.property_id = p.id
AND p.is_occupied = TRUE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
