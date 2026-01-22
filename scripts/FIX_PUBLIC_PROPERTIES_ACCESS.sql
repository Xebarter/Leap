-- ============================================================================
-- FIX: Enable Public Access to Active Properties
-- ============================================================================
-- This script adds public (anonymous) read access to active properties
-- so that non-authenticated users can browse properties on the home page
-- and properties page.
-- ============================================================================

-- Drop the existing policies that don't allow anonymous access
DROP POLICY IF EXISTS "Active properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Property hosts can view their own properties" ON public.properties;

-- Create new policies with proper public access

-- Policy 1: Anyone (including anonymous) can view active properties
CREATE POLICY "Anyone can view active properties" ON public.properties
  FOR SELECT USING (is_active = true);

-- Policy 2: Property hosts can view their own properties (even if inactive)
CREATE POLICY "Property hosts can view their own properties" ON public.properties
  FOR SELECT USING (auth.uid() = host_id);

-- Policy 3: Admins can manage all properties
CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy 4: Authenticated users can insert properties if they are admins or landlords
CREATE POLICY "Authenticated users can insert properties" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() = host_id AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (is_admin = true OR role = 'landlord')
      )
    )
  );

-- Grant permissions to anonymous users
GRANT SELECT ON public.properties TO anon;

-- ============================================================================
-- Verification Query (run this to test)
-- ============================================================================
/*
-- Test public (anonymous) access - should return active properties
SELECT id, title, location, price_ugx 
FROM public.properties 
WHERE is_active = true 
LIMIT 5;
*/

-- ============================================================================
-- DONE!
-- ============================================================================
