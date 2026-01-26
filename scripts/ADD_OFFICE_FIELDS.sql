-- ============================================================================
-- ADD OFFICE-SPECIFIC FIELDS TO PROPERTIES TABLE
-- ============================================================================
-- This script adds commercial/office-specific fields to support office buildings
-- Fields include: square footage, desk capacity, parking, meeting rooms, etc.
-- ============================================================================

-- Add office-specific fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS square_footage INTEGER,
ADD COLUMN IF NOT EXISTS desk_capacity INTEGER,
ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
ADD COLUMN IF NOT EXISTS meeting_rooms INTEGER,
ADD COLUMN IF NOT EXISTS has_24x7_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_server_room BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_reception BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_kitchenette BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.square_footage IS 'Square footage for office/commercial spaces';
COMMENT ON COLUMN public.properties.desk_capacity IS 'Number of desks/workstations available';
COMMENT ON COLUMN public.properties.parking_spaces IS 'Number of allocated parking spaces';
COMMENT ON COLUMN public.properties.meeting_rooms IS 'Number of meeting rooms included';
COMMENT ON COLUMN public.properties.has_24x7_access IS '24/7 building access available';
COMMENT ON COLUMN public.properties.has_server_room IS 'Dedicated server room access';
COMMENT ON COLUMN public.properties.has_reception IS 'Reception/front desk service available';
COMMENT ON COLUMN public.properties.has_kitchenette IS 'Kitchenette facilities available';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that all columns were added successfully
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN (
    'square_footage',
    'desk_capacity', 
    'parking_spaces',
    'meeting_rooms',
    'has_24x7_access',
    'has_server_room',
    'has_reception',
    'has_kitchenette'
  )
ORDER BY column_name;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. These fields are optional and only used for office/commercial properties
-- 2. Residential properties (apartments, hostels) will leave these NULL
-- 3. The application determines which fields to display based on category
-- 4. All fields are nullable to maintain backward compatibility
-- ============================================================================
