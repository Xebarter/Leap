-- ============================================================================
-- COMPLETE FIX FOR VISIT BOOKING ISSUES
-- ============================================================================
-- This script fixes all potential issues with visit bookings
-- ============================================================================

-- Step 1: Make tenant_id nullable
ALTER TABLE public.bookings 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Step 2: Drop old constraint if exists
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS booking_type_fields_check;

-- Step 3: Add updated constraint
ALTER TABLE public.bookings 
ADD CONSTRAINT booking_type_fields_check 
CHECK (
  (booking_type = 'rental' AND tenant_id IS NOT NULL AND check_in IS NOT NULL AND check_out IS NOT NULL AND total_price_ugx IS NOT NULL) OR
  (booking_type = 'visit' AND visit_date IS NOT NULL AND visit_time IS NOT NULL AND visitor_name IS NOT NULL)
);

-- Step 4: Drop existing visit booking policies to recreate them
DROP POLICY IF EXISTS "Anyone can create visit bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their visit bookings by email" ON public.bookings;
DROP POLICY IF EXISTS "Tenants can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenants can create bookings" ON public.bookings;

-- Step 5: Create policy for ANONYMOUS users to create visit bookings
CREATE POLICY "Anyone can create visit bookings" ON public.bookings
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (booking_type = 'visit');

-- Step 6: Create policy for authenticated users to create any bookings
CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tenant_id OR booking_type = 'visit');

-- Step 7: Create policy to view own bookings (both by tenant_id and email for visits)
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT 
  TO authenticated, anon
  USING (
    auth.uid() = tenant_id OR 
    (booking_type = 'visit' AND visitor_email = auth.jwt()->>'email')
  );

-- Step 8: Grant necessary permissions
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT ON public.bookings TO anon;

-- Step 9: Verify RLS is enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to check if everything is working)
-- ============================================================================

-- Check policies
-- SELECT policyname, permissive, roles, cmd, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'bookings';

-- Check if tenant_id is nullable
-- SELECT column_name, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'bookings' AND column_name = 'tenant_id';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
