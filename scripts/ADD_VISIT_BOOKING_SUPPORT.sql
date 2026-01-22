-- ============================================================================
-- ADD VISIT BOOKING SUPPORT TO BOOKINGS TABLE
-- ============================================================================
-- This migration adds support for scheduling property visits alongside rentals
-- ============================================================================

-- Add booking_type column to distinguish between visits and rentals
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'rental' 
CHECK (booking_type IN ('rental', 'visit'));

-- Add visit-specific fields
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS visit_date DATE,
ADD COLUMN IF NOT EXISTS visit_time TIME,
ADD COLUMN IF NOT EXISTS visitor_name TEXT,
ADD COLUMN IF NOT EXISTS visitor_phone TEXT,
ADD COLUMN IF NOT EXISTS visitor_email TEXT,
ADD COLUMN IF NOT EXISTS visit_notes TEXT;

-- Create index for booking type for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON public.bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_visit_date ON public.bookings(visit_date);

-- Update RLS policies to allow users to create visit bookings without being authenticated
-- (visits can be scheduled by potential tenants who don't have accounts yet)

-- Policy for anonymous users to create visit bookings
CREATE POLICY "Anyone can create visit bookings" ON public.bookings
  FOR INSERT 
  WITH CHECK (booking_type = 'visit');

-- Policy for users to view their visit bookings by email
CREATE POLICY "Users can view their visit bookings by email" ON public.bookings
  FOR SELECT 
  USING (
    booking_type = 'visit' AND 
    (visitor_email = auth.jwt()->>'email' OR auth.uid() = tenant_id)
  );

-- Update existing policies to work with both booking types
DROP POLICY IF EXISTS "Tenants can view their own bookings" ON public.bookings;
CREATE POLICY "Tenants can view their own bookings" ON public.bookings
  FOR SELECT 
  USING (
    auth.uid() = tenant_id OR 
    (booking_type = 'visit' AND visitor_email = auth.jwt()->>'email')
  );

-- Comments for documentation
COMMENT ON COLUMN public.bookings.booking_type IS 'Type of booking: rental (property lease) or visit (property tour/viewing)';
COMMENT ON COLUMN public.bookings.visit_date IS 'Scheduled date for property visit (only for visit bookings)';
COMMENT ON COLUMN public.bookings.visit_time IS 'Scheduled time for property visit (only for visit bookings)';
COMMENT ON COLUMN public.bookings.visitor_name IS 'Name of the visitor (for visit bookings, may differ from tenant name)';
COMMENT ON COLUMN public.bookings.visitor_phone IS 'Contact phone for visitor';
COMMENT ON COLUMN public.bookings.visitor_email IS 'Contact email for visitor';
COMMENT ON COLUMN public.bookings.visit_notes IS 'Additional notes or questions from the visitor';

-- Make some fields nullable for visit bookings since they don't apply
ALTER TABLE public.bookings 
ALTER COLUMN check_in DROP NOT NULL,
ALTER COLUMN check_out DROP NOT NULL,
ALTER COLUMN total_price_ugx DROP NOT NULL;

-- Add constraint to ensure required fields based on booking type
ALTER TABLE public.bookings 
ADD CONSTRAINT booking_type_fields_check 
CHECK (
  (booking_type = 'rental' AND check_in IS NOT NULL AND check_out IS NOT NULL AND total_price_ugx IS NOT NULL) OR
  (booking_type = 'visit' AND visit_date IS NOT NULL AND visit_time IS NOT NULL AND visitor_name IS NOT NULL)
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
