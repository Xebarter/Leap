-- ============================================================================
-- FIX VISIT BOOKING - MAKE TENANT_ID NULLABLE
-- ============================================================================
-- This fixes the issue where visit bookings fail because tenant_id is required
-- For visit bookings, tenant_id should be optional (nullable)
-- ============================================================================

-- Make tenant_id nullable for visit bookings
ALTER TABLE public.bookings 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the constraint to ensure tenant_id is provided for rental bookings
-- but optional for visit bookings
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS booking_type_fields_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT booking_type_fields_check 
CHECK (
  (booking_type = 'rental' AND tenant_id IS NOT NULL AND check_in IS NOT NULL AND check_out IS NOT NULL AND total_price_ugx IS NOT NULL) OR
  (booking_type = 'visit' AND visit_date IS NOT NULL AND visit_time IS NOT NULL AND visitor_name IS NOT NULL)
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
