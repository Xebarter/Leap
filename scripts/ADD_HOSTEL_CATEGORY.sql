-- ============================================================================
-- ADD HOSTEL AND OFFICE BUILDING CATEGORIES
-- ============================================================================
-- This script adds "Hostel" and "Office" as valid property categories
-- Both will use the same creation flow as Apartment buildings
-- (multiple floors, unit types, floor configuration, etc.)
-- ============================================================================

-- Step 1: Drop the existing CHECK constraint on category
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_category_check;

-- Step 2: Add the new CHECK constraint with "Hostel" and "Office" included
ALTER TABLE public.properties 
ADD CONSTRAINT properties_category_check 
CHECK (category IN (
  'Apartment', 
  'House', 
  'Townhouse', 
  'Studio', 
  'Bedsitter', 
  'Villa', 
  'Condo', 
  'Cottage', 
  'Hostel',
  'Office',
  'Other'
));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test that the constraint works by checking constraint definition
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_category_check';

-- Show all distinct categories currently in use
SELECT DISTINCT category, COUNT(*) as count
FROM public.properties
GROUP BY category
ORDER BY count DESC;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. "Hostel" and "Office" categories can now be used for properties
-- 2. Both building types will use the apartment creation wizard
-- 3. They support multiple floors, unit types, and floor configuration
-- 4. The constraint is non-destructive - existing data is not affected
-- ============================================================================
