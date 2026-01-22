-- ============================================================================
-- ENABLE PUBLIC ACCESS TO ACTIVE PROPERTIES
-- ============================================================================
-- This script updates the RLS policies to allow public (anonymous) access
-- to active properties, which will allow the public-facing application
-- to read and display properties from the database.
-- ============================================================================

-- Drop ALL existing policies on properties table
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Property hosts can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Active properties are viewable by everyone" ON public.properties;

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

-- Also update property_images to allow access for public properties
DROP POLICY IF EXISTS "Anyone can view images of active properties" ON public.property_images;
CREATE POLICY "Anyone can view images of active properties" ON public.property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_images.property_id AND properties.is_active = true
    )
  );

-- Grant permissions to anonymous users for property_images
GRANT SELECT ON public.property_images TO anon;

-- Update property_details to allow access for public properties
DROP POLICY IF EXISTS "Anyone can view details of active properties" ON public.property_details;
CREATE POLICY "Anyone can view details of active properties" ON public.property_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_details.property_id AND properties.is_active = true
    )
  );

-- Grant permissions to anonymous users for property_details
GRANT SELECT ON public.property_details TO anon;

-- Update property_units to allow access for public properties
DROP POLICY IF EXISTS "Units of active properties are viewable by everyone" ON public.property_units;
CREATE POLICY "Units of active properties are viewable by everyone" ON public.property_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_units.property_id AND properties.is_active = true
    )
  );

-- Grant permissions to anonymous users for property_units
GRANT SELECT ON public.property_units TO anon;

-- Update property_blocks to allow public access
DROP POLICY IF EXISTS "Property blocks are viewable by everyone" ON public.property_blocks;
CREATE POLICY "Property blocks are viewable by everyone" ON public.property_blocks
  FOR SELECT USING (true);

-- Grant permissions to anonymous users for property_blocks
GRANT SELECT ON public.property_blocks TO anon;

-- ============================================================================
-- Verification Queries (run these to test)
-- ============================================================================
/*
-- Test public (anonymous) access - should return active properties
SELECT id, title, location, price_ugx, is_active
FROM public.properties 
WHERE is_active = true 
LIMIT 5;

-- Test that you can access related data
SELECT p.id, p.title, p.location, pb.name as block_name, pb.location as block_location
FROM public.properties p
LEFT JOIN public.property_blocks pb ON p.block_id = pb.id
WHERE p.is_active = true
LIMIT 5;
*/

-- ============================================================================
-- DONE! Run this script in your Supabase SQL Editor to enable public access
-- ============================================================================